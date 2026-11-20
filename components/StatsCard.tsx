'use client';

import React from 'react';
import { LucideIcon, Filter } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  label?: string;
  description: string;
  icon: LucideIcon;
  variant: 'blue' | 'green' | 'amber' | 'red';
  badgeText?: string;
  isActive?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

const colorStyles = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
    border: 'border-slate-200 hover:border-blue-400',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: 'bg-blue-600',
    filterTag: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
  },
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-slate-200 hover:border-emerald-400',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accent: 'bg-emerald-600',
    filterTag: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'border-slate-200 hover:border-amber-400',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    accent: 'bg-amber-600',
    filterTag: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
  },
  red: {
    iconBg: 'bg-rose-50 text-rose-600',
    border: 'border-slate-200 hover:border-rose-400',
    activeBorder: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: 'bg-rose-600',
    filterTag: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
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
  isActive = false,
  onClick,
  tooltip,
}: StatsCardProps) {
  const styles = colorStyles[variant];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={tooltip || (onClick ? `Click to filter by ${title}` : undefined)}
      aria-pressed={onClick ? isActive : undefined}
      className={`relative bg-white rounded-xl p-5 border shadow-xs transition-all duration-200 flex flex-col justify-between select-none ${
        isActive ? styles.activeBorder : styles.border
      } ${
        onClick
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500'
          : ''
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-800 transition-colors">
              {label || title}
            </span>
            {isActive && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${styles.filterTag} animate-in fade-in`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`} />
                Active
              </span>
            )}
          </div>

          <div
            className={`p-2.5 rounded-lg ${styles.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-2xs`}
          >
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Count Value & Status Badge */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            {value}
          </span>
          {badgeText && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${styles.badge}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Description & Action Hint Footer */}
      <div className="text-xs text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <p className="flex items-center gap-1.5 truncate">
          <span className={`w-1.5 h-1.5 rounded-full ${styles.accent} shrink-0`} />
          <span className="truncate">{description}</span>
        </p>
        {onClick && (
          <span className="text-[10px] text-slate-400 group-hover:text-blue-600 transition-colors hidden sm:inline-block font-medium shrink-0">
            {isActive ? 'Reset' : 'Filter'}
          </span>
        )}
      </div>
    </div>
  );
}
