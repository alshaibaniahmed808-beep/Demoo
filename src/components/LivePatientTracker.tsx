'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QueueItem } from '@/types';
import { queueService } from '@/services/queueService';
import { realtimeService } from '@/lib/realtimeService';

interface LivePatientTrackerProps {
  clinicId: string;
  doctorId: string;
}

const DEBOUNCE_MS = 450;

/**
 * Mobile-first patient self-service tracker.
 * Uses a debounced search so every keystroke doesn't fire a DB query.
 * Subscribes to Realtime for live updates scoped to this doctor only.
 */
export function LivePatientTracker({ clinicId, doctorId }: LivePatientTrackerProps) {
  const [query, setQuery] = useState('');
  const [patient, setPatient] = useState<QueueItem | null>(null);
  const [patientsAhead, setPatientsAhead] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setPatient(null);
      setPatientsAhead(0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await queueService.searchPatient(clinicId, doctorId, query);
        setPatient(result);
        if (result) {
          const pos = await queueService.getPatientPosition(doctorId, result.id);
          setPatientsAhead(Math.max(0, pos - 1));
        } else {
          setPatientsAhead(0);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, clinicId, doctorId]);

  // Live updates: only subscribed when we have a patient result
  useEffect(() => {
    if (!patient) return;

    const sub = realtimeService.subscribeToQueueUpdates(clinicId, doctorId, (payload) => {
      const updated = payload.new as unknown as QueueItem | undefined;
      const deleted = payload.old as unknown as Partial<QueueItem> | undefined;

      // Update this patient's own card
      if (payload.eventType === 'UPDATE' && updated?.id === patient.id) {
        setPatient(updated);
      }

      // Recalculate position when any row ahead moves to done/calling->active
      if (
        payload.eventType === 'UPDATE' &&
        updated &&
        updated.id !== patient.id &&
        (updated.status === 'done' || updated.status === 'active')
      ) {
        setPatientsAhead((prev) => Math.max(0, prev - 1));
      }

      if (payload.eventType === 'DELETE' && deleted?.id !== patient.id) {
        setPatientsAhead((prev) => Math.max(0, prev - 1));
      }
    });

    return () => sub.unsubscribe();
  }, [patient, clinicId, doctorId]);

  const statusContent = patient ? resolveStatusContent(patient, patientsAhead) : null;

  return (
    <div className="min-h-screen bg-gradient-novro flex flex-col items-center px-4 py-10 rtl" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-sm text-center text-white mb-8">
        <h1 className="text-3xl font-display font-bold mb-1">تتبع دورك</h1>
        <p className="text-primary-100 text-sm">ابحث بالاسم أو رقم الدور</p>
      </div>

      {/* Search */}
      <div className="w-full max-w-sm mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث هنا..."
            className="w-full pl-4 pr-12 py-4 text-base rounded-2xl shadow-lg border-0 focus:outline-none focus:ring-4 focus:ring-white/30 text-right"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        </div>
        {loading && (
          <p className="text-center mt-2 text-white/70 text-sm flex items-center justify-center gap-2">
            <span className="h-3 w-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            جاري البحث...
          </p>
        )}
      </div>

      {/* Patient card */}
      {patient && statusContent && (
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animation-slide-up">
          {/* Ticket number bar */}
          <div className="bg-clinic-primary text-white text-center py-6">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">رقم دورك</p>
            <p className="text-7xl font-display font-black leading-none">
              {String(patient.ticket_number).padStart(3, '0')}
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-0.5">الاسم</p>
              <p className="text-xl font-bold text-neutral-900">{patient.patient_name}</p>
            </div>

            <StatusBadge status={patient.status} />

            {statusContent}
          </div>
        </div>
      )}

      {/* No results */}
      {query && !patient && !loading && (
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-lg animation-slide-up">
          <p className="text-lg font-semibold text-neutral-700 mb-1">لم يتم العثور على نتيجة</p>
          <p className="text-sm text-neutral-400">تحقق من الاسم أو رقم الدور</p>
        </div>
      )}

      {/* Empty state */}
      {!query && (
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center">
          <p className="text-white/60 text-sm">أدخل اسمك أو رقم دورك أعلاه</p>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveStatusContent(patient: QueueItem, patientsAhead: number): React.ReactNode {
  switch (patient.status) {
    case 'waiting':
      return (
        <div className="bg-primary-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-primary-500 font-semibold uppercase tracking-wider mb-1">
            المرضى أمامك
          </p>
          <p className="text-5xl font-display font-bold text-primary-600">{patientsAhead}</p>
          <p className="text-xs text-neutral-500 mt-1">
            وقت تقريبي: ~{patientsAhead * 15} دقيقة
          </p>
        </div>
      );
    case 'calling':
      return (
        <div className="bg-orange-50 rounded-2xl p-4 text-center animate-pulse">
          <p className="text-lg font-bold text-orange-700">يرجى التوجه إلى عيادة الطبيب الآن</p>
        </div>
      );
    case 'active':
      return (
        <div className="bg-teal-50 rounded-2xl p-4 text-center">
          <p className="text-lg font-bold text-teal-700">الطبيب جاهز لك</p>
        </div>
      );
    case 'done':
      return (
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-lg font-bold text-green-700">شكراً — تمت الاستشارة بنجاح</p>
        </div>
      );
    default:
      return null;
  }
}

const statusLabelMap: Record<string, { label: string; cls: string }> = {
  waiting: { label: 'في الانتظار',   cls: 'bg-primary-100 text-primary-700' },
  calling: { label: 'قيد الاستدعاء', cls: 'bg-orange-100 text-orange-700 animate-pulse' },
  active:  { label: 'قيد الاستشارة', cls: 'bg-teal-100 text-teal-700' },
  done:    { label: 'انتهى',         cls: 'bg-green-100 text-green-700' },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusLabelMap[status] ?? { label: status, cls: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
  </svg>
);
