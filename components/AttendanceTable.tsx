'use client';

import React from 'react';
import {
  Edit3,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  Building,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Attendance, AttendanceStatus } from '@/types/attendance';
import { formatToDisplayTime } from '@/lib/attendance/attendance-utils';

interface AttendanceTableProps {
  records: Attendance[];
  isLoading?: boolean;
  onEdit: (record: Attendance) => void;
  onDelete: (record: Attendance) => void;
  onResetFilters?: () => void;
  onAddNew?: () => void;
}

// Function to generate deterministic avatar background colors based on employee name
function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-700',
    'bg-indigo-100 text-indigo-700',
    'bg-amber-100 text-amber-700',
    'bg-teal-100 text-teal-700',
    'bg-rose-100 text-rose-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  switch (status) {
    case 'Present':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Present
        </span>
      );
    case 'Late':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Late
        </span>
      );
    case 'Half-Day':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Half-Day
        </span>
      );
    case 'Absent':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Absent
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
}

export default function AttendanceTable({
  records,
  isLoading = false,
  onEdit,
  onDelete,
  onResetFilters,
  onAddNew,
}: AttendanceTableProps) {
  // Skeleton loading view
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 w-1/4">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-200 rounded w-24" />
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-200 rounded w-16" />
              <div className="h-3 bg-slate-200 rounded w-16" />
              <div className="h-6 bg-slate-200 rounded-full w-20" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state view
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-10 sm:p-14 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No attendance records found
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          No employee records matched your active filters or search term. Try adjusting your filters or record a new attendance entry.
        </p>
        <div className="flex items-center justify-center gap-3">
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table responsive scroll container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Employee Name</th>
              <th scope="col" className="py-3.5 px-4">Department</th>
              <th scope="col" className="py-3.5 px-4">Date</th>
              <th scope="col" className="py-3.5 px-4">Check In</th>
              <th scope="col" className="py-3.5 px-4">Check Out</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {records.map((record) => {
              const displayName = record.name || record.employeeName || 'Unknown Employee';
              const avatarStyle = getAvatarColor(displayName);
              const initials = getInitials(displayName);
              const displayCheckIn = formatToDisplayTime(record.checkIn);
              const displayCheckOut = formatToDisplayTime(record.checkOut);

              return (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* 1. Employee Name & ID */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${avatarStyle} flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs shrink-0`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                          <span>{record.employeeId || 'N/A'}</span>
                          {record.email && (
                            <>
                              <span>•</span>
                              <span className="hidden sm:inline">{record.email}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 2. Department */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.department}</span>
                    </div>
                  </td>

                  {/* 3. Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.date}</span>
                    </div>
                  </td>

                  {/* 4. Check In */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{displayCheckIn}</span>
                    </div>
                  </td>

                  {/* 5. Check Out */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{displayCheckOut}</span>
                    </div>
                  </td>

                  {/* 6. Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={record.status} />
                  </td>

                  {/* 7. Actions */}
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(record)}
                        title="Edit Attendance"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        aria-label={`Edit ${displayName}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(record)}
                        title="Delete Attendance"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        aria-label={`Delete ${displayName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>Showing {records.length} records</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Late
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Half-Day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
          </span>
        </div>
      </div>
    </div>
  );
}
