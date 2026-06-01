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

export const ReceptionistControlPanel: React.FC<ReceptionistControlPanelProps> = ({
  clinicId,
  doctorId,
  doctor,
}) => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const queue = await queueService.getQueueByDoctor(doctorId, clinicId);
        setQueueItems(queue || []);
      } catch (err) {
        console.error('Error loading queue:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQueue();
  }, [clinicId, doctorId]);

  useEffect(() => {
    const subscription = realtimeService.subscribeToQueueUpdates(
      clinicId,
      doctorId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setQueueItems((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setQueueItems((prev) =>
            prev.map((item) => (item.id === payload.new.id ? payload.new : item))
          );
        } else if (payload.eventType === 'DELETE') {
          setQueueItems((prev) => prev.filter((item) => item.id !== payload.old.id));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [clinicId, doctorId]);

  const callNextPatient = useCallback(async () => {
    const waitingPatient = queueItems.find((item) => item.status === 'waiting');

    if (!waitingPatient) {
      return;
    }

    setCalling(true);

    try {
      await queueService.updateQueueStatus(waitingPatient.id, 'calling');
    } catch (err) {
      console.error('Error calling patient:', err);
    } finally {
      setCalling(false);
    }
  }, [queueItems]);

  const startConsultation = useCallback(async (queueItemId: string) => {
    try {
      await queueService.updateQueueStatus(queueItemId, 'active');
    } catch (err) {
      console.error('Error starting consultation:', err);
    }
  }, []);

  const completeConsultation = useCallback(async (queueItemId: string) => {
    try {
      await queueService.updateQueueStatus(queueItemId, 'done');
    } catch (err) {
      console.error('Error completing consultation:', err);
    }
  }, []);

  const removePatient = useCallback(async (queueItemId: string) => {
    if (confirm('هل تريد حذف هذا المريض من الطابور؟')) {
      try {
        await queueService.removePatientFromQueue(queueItemId);
      } catch (err) {
        console.error('Error removing patient:', err);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-500 rounded-full"></div>
          </div>
          <p className="mt-4 text-neutral-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const stats = {
    waiting: queueItems.filter((item) => item.status === 'waiting').length,
    calling: queueItems.filter((item) => item.status === 'calling').length,
    active: queueItems.filter((item) => item.status === 'active').length,
    done: queueItems.filter((item) => item.status === 'done').length,
  };

  return (
    <div className="min-h-screen bg-gradient-light rtl" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">
                لوحة تحكم الموظف
              </h1>
              <p className="text-sm text-neutral-600">Dr. {doctor.name} • {doctor.specialization}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-primary-50 rounded-lg">
                <p className="text-xs font-medium text-primary-700">الحالة</p>
                <p className="text-lg font-bold text-primary-600">نشط</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="في الانتظار"
            value={stats.waiting}
            icon="⏳"
            color="blue"
          />
          <StatsCard
            title="قيد الاستدعاء"
            value={stats.calling}
            icon="📢"
            color="orange"
            pulse
          />
          <StatsCard
            title="قيد الاستشارة"
            value={stats.active}
            icon="👨‍⚕️"
            color="purple"
          />
          <StatsCard
            title="انتهى"
            value={stats.done}
            icon="✅"
            color="green"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={callNextPatient}
            disabled={calling || stats.waiting === 0}
            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="text-xl">📞</span>
            <span>{calling ? 'جاري الاستدعاء...' : 'استدعاء المريض القادم'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 bg-white border-2 border-primary-500 hover:bg-primary-50 text-primary-600 font-semibold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span className="text-xl">➕</span>
            <span>إضافة مريض جديد</span>
          </button>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                  <th className="px-8 py-4 text-right text-sm font-semibold text-neutral-700">رقم الدور</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-neutral-700">اسم المريض</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-neutral-700">الرقم</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-neutral-700">الحالة</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-neutral-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center">
                      <div className="text-neutral-400">
                        <p className="text-2xl mb-2">📭</p>
                        <p className="font-medium">لا توجد مرضى حالياً</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  queueItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-neutral-100 transition duration-200 ${
                        item.status === 'calling'
                          ? 'bg-accent-50 hover:bg-accent-100'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <td className="px-8 py-4 font-bold text-2xl text-primary-600">
                        {String(item.ticket_number).padStart(3, '0')}
                      </td>
                      <td className="px-8 py-4 text-neutral-900 font-medium">{item.patient_name}</td>
                      <td className="px-8 py-4 text-neutral-600">{item.patient_phone || '-'}</td>
                      <td className="px-8 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold gap-1 ${
                            item.status === 'waiting'
                              ? 'bg-primary-100 text-primary-700'
                              : item.status === 'calling'
                              ? 'bg-accent-100 text-accent-700 animate-pulse'
                              : item.status === 'active'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <span>
                            {item.status === 'waiting'
                              ? '⏳'
                              : item.status === 'calling'
                              ? '📢'
                              : item.status === 'active'
                              ? '👨‍⚕️'
                              : '✅'}
                          </span>
                          {item.status === 'waiting'
                            ? 'في الانتظار'
                            : item.status === 'calling'
                            ? 'قيد الاستدعاء'
                            : item.status === 'active'
                            ? 'قيد الاستشارة'
                            : 'انتهى'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex gap-2">
                          {item.status === 'calling' && (
                            <button
                              onClick={() => startConsultation(item.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition font-medium"
                            >
                              بدء
                            </button>
                          )}
                          {item.status === 'active' && (
                            <button
                              onClick={() => completeConsultation(item.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition font-medium"
                            >
                              انتهيت
                            </button>
                          )}
                          <button
                            onClick={() => removePatient(item.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition font-medium"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <AddPatientModal
          clinicId={clinicId}
          doctorId={doctorId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};