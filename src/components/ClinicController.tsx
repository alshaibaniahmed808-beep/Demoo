'use client';

import React, { useState } from 'react';
import { Doctor } from '@/types';
import { TVMode } from '@/components/TVMode';
import { ReceptionistControlPanel } from '@/components/ReceptionistControlPanel';

interface ClinicLayoutProps {
  children?: React.ReactNode;
  clinicId: string;
  doctorId: string;
  doctor: Doctor;
}

export const ClinicController: React.FC<ClinicLayoutProps> = ({
  children,
  clinicId,
  doctorId,
  doctor,
}) => {
  const [mode, setMode] = useState<'dashboard' | 'tv'>('dashboard');

  return (
    <div>
      {/* Mode Toggle Button */}
      <div className="fixed bottom-8 right-8 z-50 flex gap-3">
        <button
          onClick={() => setMode('dashboard')}
          className={`px-6 py-3 rounded-lg font-semibold transition duration-300 shadow-lg ${
            mode === 'dashboard'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          📊 لوحة التحكم
        </button>
        <button
          onClick={() => setMode('tv')}
          className={`px-6 py-3 rounded-lg font-semibold transition duration-300 shadow-lg ${
            mode === 'tv'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          📺 وضع التلفاز
        </button>
      </div>

      {/* Content */}
      {mode === 'tv' ? (
        <TVMode clinicId={clinicId} doctorId={doctorId} doctor={doctor} />
      ) : (
        <ReceptionistControlPanel
          clinicId={clinicId}
          doctorId={doctorId}
          doctor={doctor}
        />
      )}

      {children}
    </div>
  );
};