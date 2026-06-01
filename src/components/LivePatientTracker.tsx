'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueueItem } from '@/types';
import { queueService } from '@/services/queueService';
import { realtimeService } from '@/lib/realtimeService';
import { debounce } from '@/lib/debounce';

interface LivePatientTrackerProps {
  clinicId: string;
  doctorId: string;
}

export const LivePatientTracker: React.FC<LivePatientTrackerProps> = ({
  clinicId,
  doctorId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientData, setPatientData] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientsAhead, setPatientsAhead] = useState(0);
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setPatientData(null);
          setPatientsAhead(0);
          return;
        }

        setLoading(true);
        try {
          const patient = await queueService.searchPatient(clinicId, doctorId, query);
          if (patient) {
            setPatientData(patient);
            const position = await queueService.getPatientPosition(doctorId, patient.id);
            setPatientsAhead(Math.max(0, position - 1));
          } else {
            setPatientData(null);
            setPatientsAhead(0);
          }
        } catch (err) {
          console.error('Search error:', err);
          setPatientData(null);
        } finally {
          setLoading(false);
        }
      }, 500),
    [clinicId, doctorId]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    if (!patientData) return;

    const subscription = realtimeService.subscribeToQueueUpdates(
      clinicId,
      doctorId,
      (payload) => {
        if (payload.new?.id === patientData.id) {
          setPatientData(payload.new);
        }

        if (
          payload.eventType === 'DELETE' ||
          (payload.new?.status === 'done' &&
            payload.old?.status !== 'done')
        ) {
          setPatientsAhead((prev) => Math.max(0, prev - 1));
        }
      }
    );

    setRealtimeSubscription(subscription);

    return () => {
      subscription.unsubscribe();
    };
  }, [patientData, clinicId, doctorId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-800';
      case 'calling':
        return 'bg-yellow-100 text-yellow-800 animate-pulse';
      case 'active':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return '⏳ في الانتظار';
      case 'calling':
        return '📢 قيد الاستدعاء';
      case 'active':
        return '👨‍⚕️ قيد الاستشارة';
      case 'done':
        return '✅ انتهى';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rtl" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تتبع دورك</h1>
          <p className="text-gray-600">ابحث عن رقم دورك أو اسمك</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="ابحث برقم دورك أو اسمك..."
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm"
          />
          {loading && <div className="text-center mt-2 text-blue-600">جاري البحث...</div>}
        </div>

        {patientData && (
          <div
            className={`${getStatusColor(patientData.status)} rounded-lg p-6 shadow-lg mb-6 transform transition`}
          >
            <div className="text-center mb-6">
              <div className="inline-block bg-white rounded-full p-4 shadow-md">
                <p className="text-sm text-gray-600 mb-1">رقم دورك</p>
                <p className="text-5xl font-bold text-blue-600">
                  {String(patientData.ticket_number).padStart(3, '0')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs opacity-75 mb-1">اسم المريض</p>
                <p className="text-lg font-semibold">{patientData.patient_name}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs opacity-75 mb-1">الحالة</p>
                  <p className="text-lg font-semibold">{getStatusLabel(patientData.status)}</p>
                </div>
              </div>

              {patientData.status === 'waiting' && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <p className="text-sm opacity-75 mb-1">المرضى أمامك</p>
                  <p className="text-3xl font-bold">{patientsAhead}</p>
                  <p className="text-xs opacity-75 mt-2">
                    الوقت المتوقع: ~{patientsAhead * 15} دقيقة
                  </p>
                </div>
              )}

              {patientData.status === 'calling' && (
                <div className="animate-bounce bg-red-500 text-white rounded-lg p-4 text-center font-bold text-lg">
                  🔴 يرجى التوجه إلى عيادة الطبيب الآن!
                </div>
              )}

              {patientData.status === 'active' && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <p className="font-semibold">الطبيب جاهز لك الآن 👋</p>
                </div>
              )}

              {patientData.status === 'done' && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <p className="text-lg font-semibold">✅ شكراً لك!</p>
                  <p className="text-sm opacity-75 mt-2">تم إنهاء الاستشارة</p>
                </div>
              )}
            </div>
          </div>
        )}

        {searchQuery && !patientData && !loading && (
          <div className="bg-white rounded-lg p-6 text-center shadow">
            <p className="text-gray-600">لم يتم العثور على نتيجة</p>
            <p className="text-sm text-gray-500 mt-2">تحقق من البيانات المدخلة</p>
          </div>
        )}

        {!searchQuery && !patientData && (
          <div className="bg-white rounded-lg p-6 text-center shadow">
            <p className="text-2xl mb-3">🔍</p>
            <p className="text-gray-600 font-medium">ابدأ البحث الآن</p>
            <p className="text-sm text-gray-500 mt-2">ادخل اسمك أو رقم دورك</p>
          </div>
        )}
      </div>
    </div>
  );
};