'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QueueItem, Doctor } from '@/types';
import { queueService } from '@/services/queueService';
import { realtimeService } from '@/lib/realtimeService';
import { AddPatientModal } from '@/components/AddPatientModal';

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
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

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
      },
      (error) => {
        console.error('Realtime error:', error);
        setTimeout(() => {
          realtimeService.subscribeToQueueUpdates(clinicId, doctorId, () => {});
        }, 5000);
      }
    );

    setRealtimeSubscription(subscription);

    return () => {
      subscription.unsubscribe();
    };
  }, [clinicId, doctorId]);

  const callNextPatient = useCallback(async () => {
    const waitingPatient = queueItems.find((item) => item.status === 'waiting');

    if (!waitingPatient) {
      alert('لا توجد مرضى ينتظرون');
      return;
    }

    setCalling(true);

    try {
      await queueService.updateQueueStatus(waitingPatient.id, 'calling');
    } catch (err) {
      console.error('Error calling patient:', err);
      alert('خطأ في استدعاء المريض');
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
    return <div className="text-center py-10">جاري التحميل...</div>;
  }

  const stats = {
    waiting: queueItems.filter((item) => item.status === 'waiting').length,
    calling: queueItems.filter((item) => item.status === 'calling').length,
    active: queueItems.filter((item) => item.status === 'active').length,
    done: queueItems.filter((item) => item.status === 'done').length,
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 rtl" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة تحكم الموظف - {doctor.name}
          </h1>
          <p className="text-gray-600">تخصص: {doctor.specialization}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium opacity-90">في الانتظار</h3>
            <p className="text-4xl font-bold mt-2">{stats.waiting}</p>
          </div>
          <div className="bg-yellow-500 text-white p-6 rounded-lg shadow animate-pulse">
            <h3 className="text-sm font-medium opacity-90">قيد الاستدعاء</h3>
            <p className="text-4xl font-bold mt-2">{stats.calling}</p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium opacity-90">قيد الاستشارة</h3>
            <p className="text-4xl font-bold mt-2">{stats.active}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium opacity-90">انتهى</h3>
            <p className="text-4xl font-bold mt-2">{stats.done}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={callNextPatient}
            disabled={calling || stats.waiting === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg shadow transition"
          >
            {calling ? 'جاري الاستدعاء...' : '📢 استدعاء المريض القادم'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow transition"
          >
            ➕ إضافة مريض جديد
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">رقم الدور</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">اسم المريض</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الرقم</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {queueItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا توجد مرضى حالياً</td>
                  </tr>
                ) : (
                  queueItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b transition ${
                        item.status === 'calling' ? 'bg-yellow-100 animate-pulse' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-lg text-blue-600">
                        {String(item.ticket_number).padStart(3, '0')}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{item.patient_name}</td>
                      <td className="px-6 py-4 text-gray-600">{item.patient_phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'waiting'
                              ? 'bg-blue-100 text-blue-700'
                              : item.status === 'calling'
                              ? 'bg-yellow-100 text-yellow-700 animate-pulse'
                              : item.status === 'active'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {item.status === 'waiting'
                            ? 'في الانتظار'
                            : item.status === 'calling'
                            ? 'قيد الاستدعاء'
                            : item.status === 'active'
                            ? 'قيد الاستشارة'
                            : 'انتهى'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {item.status === 'calling' && (
                          <button
                            onClick={() => startConsultation(item.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                          >
                            بدء
                          </button>
                        )}
                        {item.status === 'active' && (
                          <button
                            onClick={() => completeConsultation(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            انتهيت
                          </button>
                        )}
                        <button
                          onClick={() => removePatient(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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