'use client';

import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: 'clock' | 'bell' | 'steth' | 'check';
  color: 'blue' | 'orange' | 'teal' | 'green';
  pulse?: boolean;
}

const colorMap = {
  blue:   { bg: 'bg-primary-50',  border: 'border-primary-200',  text: 'text-primary-700',  value: 'text-primary-600'  },
  orange: { bg: 'bg-orange-50',   border: 'border-orange-200',   text: 'text-orange-700',   value: 'text-orange-600'   },
  teal:   { bg: 'bg-teal-50',     border: 'border-teal-200',     text: 'text-teal-700',     value: 'text-teal-600'     },
  green:  { bg: 'bg-green-50',    border: 'border-green-200',    text: 'text-green-700',    value: 'text-green-600'    },
};

type IconFC = React.FC<{ className?: string }>;

const ClockIcon: IconFC = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const BellIcon: IconFC = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const StethIcon: IconFC = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11a3 3 0 006 0V9m0 0a3 3 0 110 6 3 3 0 010-6z" />
  </svg>
);

const CheckIcon: IconFC = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const icons: Record<StatsCardProps['icon'], IconFC> = {
  clock: ClockIcon,
  bell:  BellIcon,
  steth: StethIcon,
  check: CheckIcon,
};

export function StatsCard({ title, value, icon, color, pulse = false }: StatsCardProps) {
  const styles = colorMap[color];
  const Icon = icons[icon];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 ${styles.border} ${styles.bg} p-5 shadow-sm hover:shadow-md transition duration-300 ${
        pulse ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${styles.text}`}>
            {title}
          </p>
          <p className={`text-4xl font-display font-bold ${styles.value}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 opacity-30 ${styles.value}`} />
      </div>
    </div>
  );
}
