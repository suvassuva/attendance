'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Building, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  Department,
  AttendanceFormData,
} from '@/types/attendance';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: AttendanceFormData, recordId?: string) => void;
  initialData?: AttendanceRecord | null;
  departments: Department[];
}

const STATUSES: AttendanceStatus[] = ['Present', 'Late', 'Half-Day', 'Absent'];

// Helper to convert 12-hour string (e.g. "09:00 AM") to "09:00" for input type="time"
function toTimeInput(timeStr: string): string {
  if (!timeStr || timeStr === '--:--') return '';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Helper to convert "09:00" from input type="time" to "09:00 AM"
function fromTimeInput(time24: string): string {
  if (!time24) return '--:--';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return '--:--';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
}

function AttendanceModalContent({
  initialData,
  departments,
  onClose,
  onSave,
}: {
  initialData?: AttendanceRecord | null;
  departments: Department[];
  onClose: () => void;
  onSave: (formData: AttendanceFormData, recordId?: string) => void;
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<AttendanceFormData>(() => {
    if (initialData) {
      return {
        employeeName: initialData.employeeName,
        department: initialData.department,
        date: initialData.date,
        checkIn: initialData.checkIn,
        checkOut: initialData.checkOut,
        status: initialData.status,
        notes: initialData.notes || '',
      };
    }
    return {
      employeeName: '',
      department: departments[0] || 'Engineering',
      date: '2026-11-19',
      checkIn: '09:00 AM',
      checkOut: '05:30 PM',
      status: 'Present',
      notes: '',
    };
  });

  const [rawCheckInTime, setRawCheckInTime] = useState(() =>
    initialData ? toTimeInput(initialData.checkIn) : '09:00'
  );
  const [rawCheckOutTime, setRawCheckOutTime] = useState(() =>
    initialData ? toTimeInput(initialData.checkOut) : '17:30'
  );

  const [errors, setErrors] = useState<{
    employeeName?: string;
    department?: string;
    date?: string;
    checkIn?: string;
    checkOut?: string;
    status?: string;
  }>({});

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      checkIn: newStatus === 'Absent' ? '--:--' : fromTimeInput(rawCheckInTime) || '09:00 AM',
      checkOut: newStatus === 'Absent' ? '--:--' : fromTimeInput(rawCheckOutTime) || '05:30 PM',
    }));
    if (newStatus === 'Absent') {
      setRawCheckInTime('');
      setRawCheckOutTime('');
    } else {
      if (!rawCheckInTime) setRawCheckInTime('09:00');
      if (!rawCheckOutTime) setRawCheckOutTime('17:30');
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    } else if (formData.employeeName.trim().length < 2) {
      newErrors.employeeName = 'Name must be at least 2 characters';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (formData.status !== 'Absent') {
      if (!rawCheckInTime && formData.checkIn === '--:--') {
        newErrors.checkIn = 'Check-in time is required for non-absent status';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalData: AttendanceFormData = {
      ...formData,
      employeeName: formData.employeeName.trim(),
      checkIn: formData.status === 'Absent' ? '--:--' : fromTimeInput(rawCheckInTime),
      checkOut:
        formData.status === 'Absent'
          ? '--:--'
          : rawCheckOutTime
          ? fromTimeInput(rawCheckOutTime)
          : '--:--',
    };

    onSave(finalData, initialData?.id);
  };

  return (
    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
        <div>
          <h3 id="modal-title" className="text-lg font-bold text-slate-900">
            {isEditing ? 'Edit Attendance Record' : 'Add Attendance Record'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEditing
              ? 'Update employee check-in, check-out and attendance status'
              : 'Enter employee details and record daily attendance status'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Employee Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Employee Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={formData.employeeName}
              onChange={(e) => {
                setFormData({ ...formData, employeeName: e.target.value });
                if (errors.employeeName) setErrors({ ...errors, employeeName: undefined });
              }}
              placeholder="e.g. Sarah Jenkins"
              className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                errors.employeeName
                  ? 'border-rose-400 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              } rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all`}
            />
          </div>
          {errors.employeeName && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.employeeName}
            </p>
          )}
        </div>

        {/* Department & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={formData.department}
                onChange={(e) => {
                  setFormData({ ...formData, department: e.target.value as Department });
                  if (errors.department) setErrors({ ...errors, department: undefined });
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  if (errors.date) setErrors({ ...errors, date: undefined });
                }}
                className={`w-full pl-9 pr-3 py-1.5 sm:py-2 text-sm bg-white border ${
                  errors.date
                    ? 'border-rose-400 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                } rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 transition-all cursor-pointer`}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.date}
              </p>
            )}
          </div>
        </div>

        {/* Attendance Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Attendance Status <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATUSES.map((st) => {
              const isSelected = formData.status === st;
              let activeColor = 'border-blue-600 bg-blue-50 text-blue-700 font-semibold';
              if (st === 'Present')
                activeColor = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold';
              if (st === 'Late')
                activeColor = 'border-amber-500 bg-amber-50 text-amber-800 font-semibold';
              if (st === 'Half-Day')
                activeColor = 'border-yellow-500 bg-yellow-50 text-yellow-800 font-semibold';
              if (st === 'Absent')
                activeColor = 'border-rose-500 bg-rose-50 text-rose-800 font-semibold';

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 text-xs rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? activeColor
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Check-In & Check-Out Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Check-in time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Check-in Time {formData.status !== 'Absent' && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="time"
                disabled={formData.status === 'Absent'}
                value={rawCheckInTime}
                onChange={(e) => {
                  setRawCheckInTime(e.target.value);
                  if (errors.checkIn) setErrors({ ...errors, checkIn: undefined });
                }}
                className={`w-full pl-9 pr-3 py-1.5 sm:py-2 text-sm bg-white border ${
                  errors.checkIn
                    ? 'border-rose-400 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                } rounded-lg text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-hidden focus:ring-2 transition-all`}
              />
            </div>
            {errors.checkIn && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.checkIn}
              </p>
            )}
          </div>

          {/* Check-out time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Check-out Time
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="time"
                disabled={formData.status === 'Absent'}
                value={rawCheckOutTime}
                onChange={(e) => setRawCheckOutTime(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Notes / Remarks <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Remote work, client visit, approved leave..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Save Attendance'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AttendanceModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  departments,
}: AttendanceModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop click area */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card keyed for auto-resetting state without cascading effects */}
      <AttendanceModalContent
        key={initialData?.id ?? 'create-attendance-modal'}
        initialData={initialData}
        departments={departments}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
}
