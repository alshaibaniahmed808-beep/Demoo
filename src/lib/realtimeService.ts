// ============================================
// Realtime Service - WebSocket Streaming
// ============================================

import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeCallback = (payload: any) => void;

interface RealtimeSubscription {
  channel: any;
  unsubscribe: () => void;
}

export const realtimeService = {
  subscribeToQueueUpdates(
    clinicId: string,
    doctorId: string,
    onUpdate: RealtimeCallback,
    onError?: (error: Error) => void
  ): RealtimeSubscription {
    const channelName = `queue_updates_${clinicId}_${doctorId}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_items',
          filter: `clinic_id=eq.${clinicId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.new?.doctor_id === doctorId || payload.old?.doctor_id === doctorId) {
            onUpdate(payload);
          }
        }
      )
      .on('error', (error: any) => {
        console.error('Realtime subscription error:', error);
        if (onError) onError(new Error(error.message));
      })
      .subscribe(
        (status: string) => {
          console.log(`Realtime subscription status: ${status}`);
          if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.warn('Attempting to reconnect...');
            setTimeout(() => {
              channel.subscribe();
            }, 3000);
          }
        }
      );

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  subscribeToCallNotifications(
    clinicId: string,
    doctorId: string,
    onCall: RealtimeCallback
  ): RealtimeSubscription {
    const channelName = `patient_calls_${clinicId}_${doctorId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue_items',
          filter: `and(clinic_id=eq.${clinicId},doctor_id=eq.${doctorId},status=eq.calling)`,
        },
        onCall
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  subscribeToSessionUpdates(
    sessionId: string,
    onUpdate: RealtimeCallback
  ): RealtimeSubscription {
    const channelName = `session_${sessionId}`;

    const channel = supabase
      .channel(channelName)
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
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  async broadcastEvent(channel: string, event: string, data: any) {
    return supabase.channel(channel).send({
      type: 'broadcast',
      event,
      payload: data,
    });
  },
};