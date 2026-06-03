import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeCallback = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

function buildQueueChannel(
  clinicId: string,
  doctorId: string,
  onUpdate: RealtimeCallback,
  onError?: (err: Error) => void
): RealtimeChannel {
  const channelName = `queue:${clinicId}:${doctorId}`;

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_items',
        // Filter at DB level to only receive rows for this doctor — minimises server load
        filter: `doctor_id=eq.${doctorId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const row = (payload.new ?? payload.old) as Record<string, unknown>;
        // Guard: only process rows belonging to the correct clinic
        if (row?.clinic_id === clinicId) {
          onUpdate(payload);
        }
      }
    );
}

export const realtimeService = {
  /**
   * Subscribe to all queue_items changes for a specific doctor.
   * The filter is applied at the Postgres replication level (doctor_id=eq.X)
   * so only relevant row-change events are transmitted to this client,
   * reducing bandwidth and server fanout.
   *
   * Auto-reconnect: backs off exponentially up to MAX_RECONNECT_ATTEMPTS
   * before giving up, calling onError on permanent failure.
   */
  subscribeToQueueUpdates(
    clinicId: string,
    doctorId: string,
    onUpdate: RealtimeCallback,
    onError?: (err: Error) => void
  ): RealtimeSubscription {
    let channel: RealtimeChannel;
    let attempts = 0;
    let destroyed = false;

    function subscribe() {
      channel = buildQueueChannel(clinicId, doctorId, onUpdate, onError);

      channel.subscribe((status, err) => {
        if (destroyed) return;

        if (status === 'SUBSCRIBED') {
          attempts = 0;
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (err) console.error('[Realtime] channel error:', err);

          attempts += 1;
          if (attempts > MAX_RECONNECT_ATTEMPTS) {
            onError?.(new Error(`Realtime: max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`));
            return;
          }

          const delay = RECONNECT_DELAY_MS * Math.min(attempts, 8);
          console.warn(`[Realtime] reconnecting in ${delay}ms (attempt ${attempts})`);
          setTimeout(() => {
            if (!destroyed) {
              supabase.removeChannel(channel);
              subscribe();
            }
          }, delay);
        }
      });
    }

    subscribe();

    return {
      unsubscribe() {
        destroyed = true;
        supabase.removeChannel(channel);
      },
    };
  },

  subscribeToSessionUpdates(
    sessionId: string,
    onUpdate: RealtimeCallback
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'receptionist_sessions',
          filter: `id=eq.${sessionId}`,
        },
        onUpdate
      )
      .subscribe();

    return {
      unsubscribe: () => supabase.removeChannel(channel),
    };
  },
};
