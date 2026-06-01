'use client';

import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'orange' | 'purple' | 'green';
  pulse?: boolean;
}

const colorStyles = {
  blue: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    text: 'text-primary-700',
    icon: 'text-primary-600',
    value: 'text-primary-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'text-orange-600',
    value: 'text-orange-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-600',
    value: 'text-purple-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
    value: 'text-green-600',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  pulse = false,
}) => {
  const styles = colorStyles[color];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 ${styles.border} ${styles.bg} p-6 shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105 ${pulse ? 'animate-pulse-soft' : ''}`}
    >
      {/* Background decoration */}
      <div className="absolute -top-4 -right-4 opacity-10 text-4xl">{icon}</div>

      <div className="relative z-10">
        <p className={`text-sm font-semibold ${styles.text} mb-2 uppercase tracking-wide`}>
          {title}
        </p>
        <p className={`text-4xl font-display font-bold ${styles.value}`}>
          {value}
        </p>
      </div>

      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 opacity-0 hover:opacity-5 bg-gradient-to-br from-white to-transparent transition duration-300`}></div>
    </div>
  );
};