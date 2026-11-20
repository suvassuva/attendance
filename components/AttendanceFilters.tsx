'use client';

import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Building2, UserCheck, MapPin } from 'lucide-react';
import { AttendanceFiltersState, AttendanceStatus, Department, Branch } from '@/types/attendance';

interface AttendanceFiltersProps {
  filters: AttendanceFiltersState;
  onFilterChange: <K extends keyof AttendanceFiltersState>(
    key: K,
    value: AttendanceFiltersState[K]
  ) => void;
  onResetFilters: () => void;
  departments: Department[];
  branches: Branch[];
  totalResults: number;
  totalRecords: number;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['Present', 'Late', 'Half-Day', 'Absent'];

export default function AttendanceFilters({
  filters,
  onFilterChange,
  onResetFilters,
  departments,
  branches,
  totalResults,
  totalRecords,
}: AttendanceFiltersProps) {
  const isFiltered =
    Boolean(filters.searchQuery) ||
    Boolean(filters.department) ||
    Boolean(filters.branch) ||
    Boolean(filters.status) ||
    Boolean(filters.date);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Top Filter Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Filter Records</h2>
          <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
            Showing {totalResults} of {totalRecords}
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Search by employee name or ID */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Search Employee
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              placeholder="Search employee name..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {/* 2. Filter by role (BM / ABM only) */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Role / Designation
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.department}
              onChange={(e) => onFilterChange('department', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
            >
              <option value="">All Roles (BM & ABM)</option>
              <option value="BM">BM (Branch Manager)</option>
              <option value="ABM">ABM (Assistant Branch Manager)</option>
            </select>
          </div>
        </div>

        {/* 3. Filter by branch */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Branch / Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.branch}
              onChange={(e) => onFilterChange('branch', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map((br) => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Filter by attendance status */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Attendance Status
          </label>
          <div className="relative">
            <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Date picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-600">
              Date Filter
            </label>
            {filters.date && (
              <button
                type="button"
                onClick={() => onFilterChange('date', '')}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Clear date
              </button>
            )}
          </div>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onFilterChange('date', e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

