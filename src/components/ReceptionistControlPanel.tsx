'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QueueItem, Doctor } from '@/types';
import { queueService } from '@/services/queueService';
import { realtimeService } from '@/lib/realtimeService';
import { AddPatientModal } from '@/components/AddPatientModal';
import { StatsCard } from '@/components/StatsCard';

interface ReceptionistControlPanelProps {
  clinicId: string;
  doctorId: string;
  doctor: Doctor;
}

export function ReceptionistControlPanel({
  clinicId,
  doctorId,
  doctor,
}: ReceptionistControlPanelProps) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    queueService
      .getQueueByDoctor(doctorId, clinicId)
      .then((queue) => setQueueItems(queue ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clinicId, doctorId]);

  useEffect(() => {
    const sub = realtimeService.subscribeToQueueUpdates(clinicId, doctorId, (payload) => {
      const newRow = payload.new as unknown as QueueItem;
      const oldRow = payload.old as unknown as Partial<QueueItem>;
      if (payload.eventType === 'INSERT') {
        setQueueItems((prev) => [...prev, newRow]);
      } else if (payload.eventType === 'UPDATE') {
        setQueueItems((prev) =>
          prev.map((item) => (item.id === newRow.id ? newRow : item))
        );
      } else if (payload.eventType === 'DELETE') {
        setQueueItems((prev) => prev.filter((item) => item.id !== oldRow.id));
      }
    });
    return () => sub.unsubscribe();
  }, [clinicId, doctorId]);

  const callNextPatient = useCallback(async () => {
    const next = queueItems.find((item) => item.status === 'waiting');
    if (!next) return;
    setCalling(true);
    try {
      await queueService.updateQueueStatus(next.id, 'calling');
    } catch (err) {
      console.error('Error calling patient:', err);
    } finally {
      setCalling(false);
    }
  }, [queueItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-neutral-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const stats = {
    waiting: queueItems.filter((i) => i.status === 'waiting').length,
    calling: queueItems.filter((i) => i.status === 'calling').length,
    active:  queueItems.filter((i) => i.status === 'active').length,
    done:    queueItems.filter((i) => i.status === 'done').length,
  };

  return (
    <div className="min-h-screen bg-gradient-light rtl" dir="rtl">
      <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">لوحة تحكم الموظف</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              د. {doctor.name} &bull; {doctor.specialization}
            </p>
          </div>
          <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
            نشط
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="في الانتظار"   value={stats.waiting} icon="clock" color="blue" />
          <StatsCard title="قيد الاستدعاء" value={stats.calling} icon="bell"  color="orange" pulse={stats.calling > 0} />
          <StatsCard title="قيد الاستشارة" value={stats.active}  icon="steth" color="teal" />
          <StatsCard title="انتهى"         value={stats.done}    icon="check" color="green" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={callNextPatient}
            disabled={calling || stats.waiting === 0}
            className="flex-1 bg-clinic-primary hover:opacity-90 disabled:opacity-40 text-white font-semibold py-4 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 text-base"
          >
            {calling ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الاستدعاء...
              </>
            ) : (
              'استدعاء المريض القادم'
            )}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 bg-white border-2 border-clinic-primary text-clinic-primary hover:bg-neutral-50 font-semibold py-4 px-6 rounded-xl transition flex items-center justify-center gap-2 text-base"
          >
            + إضافة مريض جديد
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-right font-semibold text-neutral-600">رقم الدور</th>
                  <th className="px-6 py-4 text-right font-semibold text-neutral-600">اسم المريض</th>
                  <th className="px-6 py-4 text-right font-semibold text-neutral-600 hidden md:table-cell">الهاتف</th>
                  <th className="px-6 py-4 text-right font-semibold text-neutral-600">الحالة</th>
                  <th className="px-6 py-4 text-right font-semibold text-neutral-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-neutral-400 font-medium">
                      لا توجد مرضى حالياً
                    </td>
                  </tr>
                ) : (
                  queueItems.map((item) => (
                    <QueueRow
                      key={item.id}
                      item={item}
                      onStart={() =>
                        queueService.updateQueueStatus(item.id, 'active').catch(console.error)
                      }
                      onComplete={() =>
                        queueService.updateQueueStatus(item.id, 'done').catch(console.error)
                      }
                      onRemove={() => {
                        if (confirm('هل تريد حذف هذا المريض من الطابور؟')) {
                          queueService.removePatientFromQueue(item.id).catch(console.error);
                        }
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddPatientModal
          clinicId={clinicId}
          doctorId={doctorId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

interface QueueRowProps {
  item: QueueItem;
  onStart: () => void;
  onComplete: () => void;
  onRemove: () => void;
}

function QueueRow({ item, onStart, onComplete, onRemove }: QueueRowProps) {
  const statusMeta: Record<string, { label: string; cls: string }> = {
    waiting: { label: 'في الانتظار',   cls: 'bg-primary-100 text-primary-700' },
    calling: { label: 'قيد الاستدعاء', cls: 'bg-orange-100 text-orange-700 animate-pulse' },
    active:  { label: 'قيد الاستشارة', cls: 'bg-teal-100 text-teal-700' },
    done:    { label: 'انتهى',         cls: 'bg-green-100 text-green-700' },
  };
  const meta = statusMeta[item.status] ?? {
    label: item.status,
    cls: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <tr
      className={`border-b border-neutral-100 transition ${
        item.status === 'calling' ? 'bg-orange-50' : 'hover:bg-neutral-50'
      }`}
    >
      <td className="px-6 py-4 font-bold text-xl text-clinic-primary">
        {String(item.ticket_number).padStart(3, '0')}
      </td>
      <td className="px-6 py-4 font-medium text-neutral-900">{item.patient_name}</td>
      <td className="px-6 py-4 text-neutral-500 hidden md:table-cell">
        {item.patient_phone ?? '-'}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
          {meta.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 flex-wrap">
          {item.status === 'calling' && (
            <button
              onClick={onStart}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-lg transition font-medium"
            >
              بدء
            </button>
          )}
          {item.status === 'active' && (
            <button
              onClick={onComplete}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition font-medium"
            >
              انتهيت
            </button>
          )}
          <button
            onClick={onRemove}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition font-medium"
          >
            حذف
          </button>
        </div>
      </td>
    </tr>
  );
}
