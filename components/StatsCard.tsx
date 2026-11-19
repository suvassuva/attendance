'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  label?: string;
  description: string;
  icon: LucideIcon;
  variant: 'blue' | 'green' | 'amber' | 'red';
  badgeText?: string;
}

const colorStyles = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
    border: 'border-slate-200 hover:border-blue-300',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: 'bg-blue-600',
  },
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-slate-200 hover:border-emerald-300',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accent: 'bg-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'border-slate-200 hover:border-amber-300',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    accent: 'bg-amber-600',
  },
  red: {
    iconBg: 'bg-rose-50 text-rose-600',
    border: 'border-slate-200 hover:border-rose-300',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: 'bg-rose-600',
  },
};

export default function StatsCard({
  title,
  value,
  label,
  description,
  icon: Icon,
  variant,
  badgeText,
}: StatsCardProps) {
  const styles = colorStyles[variant];

  return (
    <div
      className={`relative bg-white rounded-xl p-5 border ${styles.border} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label || title}
          </span>
          <div className={`p-2.5 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
          {badgeText && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${styles.badge}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${styles.accent}`} />
        <span>{description}</span>
      </p>
    </div>
  );
}

