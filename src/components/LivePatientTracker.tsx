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
        return 'bg-gradient-to-br from-primary-50 to-primary-100';
      case 'calling':
        return 'bg-gradient-to-br from-accent-50 to-accent-100';
      case 'active':
        return 'bg-gradient-to-br from-purple-50 to-purple-100';
      case 'done':
        return 'bg-gradient-to-br from-green-50 to-green-100';
      default:
        return 'bg-neutral-50';
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
    <div className="min-h-screen bg-gradient-novro rtl p-6 md:p-8" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-10 text-center text-white">
          <h1 className="text-4xl font-display font-bold mb-2">تتبع دورك</h1>
          <p className="text-primary-100 text-lg">ابحث عن رقم دورك أو اسمك</p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="ابحث برقم دورك أو اسمك..."
              className="w-full px-6 py-4 text-lg border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-accent-300 transition text-right font-medium placeholder:text-neutral-400"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🔍</div>
          </div>
          {loading && (
            <p className="text-center mt-3 text-primary-100 font-medium flex items-center justify-center gap-2">
              <div className="inline-block animate-spin h-4 w-4 border-2 border-primary-100 border-t-white rounded-full"></div>
              جاري البحث...
            </p>
          )}
        </div>

        {/* Patient Card */}
        {patientData && (
          <div className={`${getStatusColor(patientData.status)} rounded-3xl p-8 shadow-2xl mb-6 transform transition duration-300 animate-slide-up border-2 border-white/20`}>
            {/* Ticket Number - Large Display */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white rounded-3xl p-6 shadow-lg">
                <p className="text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wider">رقم دورك</p>
                <p className="text-6xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  {String(patientData.ticket_number).padStart(3, '0')}
                </p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="space-y-5 mb-8">
              {/* Name */}
              <div>
                <p className="text-xs font-semibold opacity-75 mb-1 uppercase tracking-wide">اسم المريض</p>
                <p className="text-2xl font-bold text-neutral-900">{patientData.patient_name}</p>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold opacity-75 mb-2 uppercase tracking-wide">الحالة</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 rounded-full font-semibold">
                  <span className="text-lg">
                    {patientData.status === 'waiting'
                      ? '⏳'
                      : patientData.status === 'calling'
                      ? '📢'
                      : patientData.status === 'active'
                      ? '👨‍⚕️'
                      : '✅'}
                  </span>
                  <span className="text-neutral-900">{getStatusLabel(patientData.status)}</span>
                </div>
              </div>
            </div>

            {/* Status-Specific Content */}
            {patientData.status === 'waiting' && (
              <div className="bg-white/80 rounded-2xl p-6 text-center">
                <p className="text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">المرضى أمامك</p>
                <p className="text-5xl font-display font-bold text-primary-600 mb-3">{patientsAhead}</p>
                <p className="text-sm font-medium text-neutral-700">
                  الوقت المتوقع: <span className="font-bold text-primary-600">~{patientsAhead * 15} دقيقة</span>
                </p>
              </div>
            )}

            {patientData.status === 'calling' && (
              <div className="bg-white/90 rounded-2xl p-6 text-center animate-pulse">
                <p className="text-4xl mb-3">🔔</p>
                <p className="text-2xl font-bold text-accent-600">يرجى التوجه إلى عيادة الطبيب الآن!</p>
              </div>
            )}

            {patientData.status === 'active' && (
              <div className="bg-white/80 rounded-2xl p-6 text-center">
                <p className="text-4xl mb-3">👋</p>
                <p className="text-xl font-bold text-neutral-900">الطبيب جاهز لك الآن</p>
              </div>
            )}

            {patientData.status === 'done' && (
              <div className="bg-white/80 rounded-2xl p-6 text-center">
                <p className="text-5xl mb-3">✅</p>
                <p className="text-xl font-bold text-green-600">شكراً لك!</p>
                <p className="text-sm text-neutral-600 mt-2">تم إنهاء الاستشارة بنجاح</p>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {searchQuery && !patientData && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg animate-slide-up">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-lg font-semibold text-neutral-700 mb-1">لم يتم العثور على نتيجة</p>
            <p className="text-sm text-neutral-500">تحقق من رقم دورك أو اسمك</p>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && !patientData && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <p className="text-5xl mb-4">🔎</p>
            <p className="text-lg font-semibold text-neutral-700 mb-2">ابدأ البحث الآن</p>
            <p className="text-sm text-neutral-500">أدخل رقم دورك أو اسمك بالأعلى</p>
          </div>
        )}
      </div>
    </div>
  );
};