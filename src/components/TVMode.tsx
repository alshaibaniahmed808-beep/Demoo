'use client';

import React, { useState, useEffect } from 'react';
import { QueueItem, Doctor } from '@/types';
import { queueService } from '@/services/queueService';
import { realtimeService } from '@/lib/realtimeService';

interface TVModeProps {
  clinicId: string;
  doctorId: string;
  doctor: Doctor;
}

export const TVMode: React.FC<TVModeProps> = ({
  clinicId,
  doctorId,
  doctor,
}) => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCalling, setCurrentCalling] = useState<QueueItem | null>(null);
  const [nextPatients, setNextPatients] = useState<QueueItem[]>([]);
  const [time, setTime] = useState(new Date());

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

  // تحديث البيانات عند التغيير
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

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تحديث المريض الحالي والتالي
  useEffect(() => {
    const calling = queueItems.find((item) => item.status === 'calling');
    const active = queueItems.find((item) => item.status === 'active');
    const current = calling || active;

    setCurrentCalling(current || null);
    setNextPatients(
      queueItems
        .filter((item) => item.status === 'waiting')
        .slice(0, 5)
    );
  }, [queueItems]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gradient-novro flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="h-16 w-16 border-4 border-white/30 border-t-white rounded-full"></div>
          </div>
          <p className="mt-6 text-white text-2xl font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const stats = {
    waiting: queueItems.filter((item) => item.status === 'waiting').length,
    calling: queueItems.filter((item) => item.status === 'calling').length,
    active: queueItems.filter((item) => item.status === 'active').length,
  };

  return (
    <div className="w-screen h-screen bg-gradient-novro overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-1">
              {doctor.name}
            </h1>
            <p className="text-lg text-primary-100">{doctor.specialization}</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-display font-bold text-white mb-1">
              {formatTime(time)}
            </p>
            <p className="text-lg text-primary-100">
              {time.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Current Patient - Left Side (60%) */}
        <div className="w-3/5 flex flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-white"></div>
          </div>

          {currentCalling ? (
            <div className="relative z-10 text-center">
              {/* Status indicator */}
              <div className="inline-block mb-8 px-8 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <p className="text-white/80 text-lg font-semibold uppercase tracking-wider">
                  {currentCalling.status === 'calling' ? '🔔 قيد الاستدعاء' : '👨‍⚕️ قيد الاستشارة'}
                </p>
              </div>

              {/* Ticket Number - HUGE */}
              <div className="mb-12">
                <p className="text-white/60 text-2xl font-semibold mb-4 uppercase tracking-wider">
                  رقم الدور
                </p>
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border-4 border-white/20 inline-block">
                  <p className="text-9xl font-display font-black text-white drop-shadow-2xl animate-pulse">
                    {String(currentCalling.ticket_number).padStart(3, '0')}
                  </p>
                </div>
              </div>

              {/* Patient Name */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 inline-block mb-8">
                <p className="text-white/60 text-sm font-semibold mb-2 uppercase tracking-wider">
                  اسم المريض
                </p>
                <p className="text-white text-4xl font-bold">{currentCalling.patient_name}</p>
              </div>

              {/* Status Animation */}
              {currentCalling.status === 'calling' && (
                <div className="mt-12 flex gap-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-4 h-4 bg-white rounded-full animate-bounce"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 text-center">
              <div className="text-8xl mb-8 opacity-30">👋</div>
              <h2 className="text-5xl font-bold text-white mb-4">لا توجد مرضى حالياً</h2>
              <p className="text-2xl text-primary-100">في انتظار المريض التالي...</p>
            </div>
          )}
        </div>

        {/* Queue Info - Right Side (40%) */}
        <div className="w-2/5 bg-black/30 backdrop-blur-md border-l border-white/10 flex flex-col p-8 overflow-hidden">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
              <p className="text-white/60 text-xs font-semibold mb-2 uppercase">في الانتظار</p>
              <p className="text-white text-4xl font-bold">{stats.waiting}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
              <p className="text-white/60 text-xs font-semibold mb-2 uppercase">قيد الاستدعاء</p>
              <p className="text-white text-4xl font-bold animate-pulse">{stats.calling}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
              <p className="text-white/60 text-xs font-semibold mb-2 uppercase">قيد الاستشارة</p>
              <p className="text-white text-4xl font-bold">{stats.active}</p>
            </div>
          </div>

          {/* Next Patients */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">
              المرضى التاليون
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {nextPatients.length > 0 ? (
                nextPatients.map((patient, index) => (
                  <div
                    key={patient.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:border-white/40 hover:bg-white/15 transition duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-center gap-4">
                      {/* Ticket Number */}
                      <div className="bg-gradient-to-br from-primary-400 to-accent-400 rounded-lg w-16 h-16 flex items-center justify-center flex-shrink-0">
                        <p className="text-white text-2xl font-bold">
                          {String(patient.ticket_number).padStart(2, '0')}
                        </p>
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-lg truncate">
                          {patient.patient_name}
                        </p>
                        <p className="text-white/60 text-sm">
                          #{index + 1} في الطابور
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="bg-accent-500/20 rounded-lg px-3 py-1 border border-accent-400/50">
                        <p className="text-accent-300 text-xs font-semibold">✓ في الانتظار</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <p className="text-white/40 text-2xl mb-2">📋</p>
                    <p className="text-white/40 text-sm">لا يوجد مرضى ينتظرون</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wider">
              إجمالي المرضى اليوم
            </p>
            <p className="text-white text-3xl font-bold">
              {stats.waiting + stats.calling + stats.active}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar CSS */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};