'use client';

import React, { useSyncExternalStore } from 'react';
import { Plus, Search, Calendar, Bell } from 'lucide-react';

interface HeaderProps {
  onAddClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const emptySubscribe = () => () => {};

function getClientDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getServerDate() {
  return 'Thursday, Nov 19, 2026';
}

export default function Header({ onAddClick, searchQuery, onSearchChange }: HeaderProps) {
  // Hydration-safe client date using React standard useSyncExternalStore
  const currentDate = useSyncExternalStore(emptySubscribe, getClientDate, getServerDate);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Left: Title & Date */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shadow-blue-500/20">
                  <span className="tracking-tight">AM</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Attendance Management
                </h1>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentDate}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Search, Add Button, Profile */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Quick Header Search */}
            <div className="relative flex-1 sm:w-64 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Quick search employee..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Add Attendance Button */}
            <button
              type="button"
              onClick={onAddClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs shadow-blue-600/20 whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Attendance</span>
            </button>

            {/* Notification & User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                aria-label="Notifications"
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
                  AM
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">Alex Morgan</p>
                  <p className="text-[11px] text-slate-500 leading-tight">HR Operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
