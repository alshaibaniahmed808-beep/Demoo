'use client';

import React, { useState, useEffect } from 'react';
import { QueueItem } from '@/types';
import { queueService } from '@/services/queueService';
import { realtimeService } from '@/lib/realtimeService';

interface TVModeFullscreenProps {
  clinicId: string;
  doctorId: string;
}

/**
 * Advanced TV Mode with fullscreen support
 * يدعم:
 * - Fullscreen API
 * - Auto-refresh
 * - Landscape orientation
 * - Touch gestures
 */
export const TVModeFullscreen: React.FC<TVModeFullscreenProps> = ({
  clinicId,
  doctorId,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [currentCalling, setCurrentCalling] = useState<QueueItem | null>(null);
  const [nextPatients, setNextPatients] = useState<QueueItem[]>([]);
  const [time, setTime] = useState(new Date());

  // Request fullscreen
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        // Lock orientation on mobile (API not yet in all TS libs — use any cast)
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
          unlock?: () => void;
        };
        await orientation.lock?.('landscape');
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        const orientation = screen.orientation as ScreenOrientation & {
          unlock?: () => void;
        };
        orientation.unlock?.();
      }
    } catch (err) {
      console.error('Exit fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load queue
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const queue = await queueService.getQueueByDoctor(doctorId, clinicId);
        setQueueItems(queue || []);
      } catch (err) {
        console.error('Error loading queue:', err);
      }
    };

    loadQueue();
  }, [clinicId, doctorId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const subscription = realtimeService.subscribeToQueueUpdates(
      clinicId,
      doctorId,
      (payload) => {
        const newRow = payload.new as unknown as QueueItem;
        const oldRow = payload.old as unknown as Partial<QueueItem>;
        if (payload.eventType === 'INSERT') {
          setQueueItems((prev) => [...prev, newRow]);
        } else if (payload.eventType === 'UPDATE') {
          setQueueItems((prev) => prev.map((item) => (item.id === newRow.id ? newRow : item)));
        } else if (payload.eventType === 'DELETE') {
          setQueueItems((prev) => prev.filter((item) => item.id !== oldRow.id));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [clinicId, doctorId]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update current patient and next patients
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="w-full h-full bg-gradient-novro">
      {/* Fullscreen toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold backdrop-blur-md border border-white/20 transition"
        >
          {isFullscreen ? '🗖' : '⛶'} {isFullscreen ? 'خروج' : 'ملء الشاشة'}
        </button>
      </div>

      {/* Main content */}
      <div className="w-full h-full flex">
        {/* Current patient section */}
        <div className="w-3/5 flex flex-col justify-center items-center p-12">
          {currentCalling ? (
            <div className="text-center">
              <p className="text-white/60 text-xl font-semibold mb-6 uppercase tracking-wider">
                رقم الدور
              </p>
              <div className="text-9xl font-display font-black text-white drop-shadow-2xl animate-pulse">
                {String(currentCalling.ticket_number).padStart(3, '0')}
              </div>
              <p className="text-white text-5xl font-bold mt-12">{currentCalling.patient_name}</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-8xl mb-8 opacity-30">👋</div>
              <h2 className="text-5xl font-bold text-white">لا توجد مرضى حالياً</h2>
            </div>
          )}
        </div>

        {/* Queue info section */}
        <div className="w-2/5 bg-black/30 backdrop-blur-md flex flex-col p-8 overflow-hidden">
          {/* Time */}
          <div className="text-center mb-8 pb-6 border-b border-white/10">
            <p className="text-white/60 text-sm font-semibold mb-2">الوقت</p>
            <p className="text-white text-4xl font-bold">{formatTime(time)}</p>
          </div>

          {/* Queue list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {nextPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-primary-400 to-accent-400 rounded-lg w-12 h-12 flex items-center justify-center">
                    <p className="text-white text-lg font-bold">
                      {String(patient.ticket_number).padStart(2, '0')}
                    </p>
                  </div>
                  <p className="text-white font-semibold">{patient.patient_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};