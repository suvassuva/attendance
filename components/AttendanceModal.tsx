'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Attendance,
  AttendanceStatus,
  Department,
  Branch,
  AttendanceFormData,
  ValidationErrors,
} from '@/types/attendance';
import { validateAttendance } from '@/lib/attendance/attendance-validation';
import { formatToHHmm } from '@/lib/attendance/attendance-utils';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: AttendanceFormData, recordId?: string) => Promise<boolean | void> | boolean | void;
  initialData?: Attendance | null;
  departments: Department[];
  branches: Branch[];
  isSubmitting?: boolean;
}

const STATUSES: AttendanceStatus[] = ['Present', 'Late', 'Half-Day', 'Absent'];

// Converts HH:mm (or 12-hour AM/PM) to HH:mm for native time input
function toTimeInput(timeStr?: string): string {
  if (!timeStr || timeStr === '--:--') return '';
  const formatted = formatToHHmm(timeStr);
  return formatted === '--:--' ? '' : formatted;
}

function AttendanceModalContent({
  initialData,
  departments,
  branches,
  onClose,
  onSave,
  isSubmitting = false,
}: {
  initialData?: Attendance | null;
  departments: Department[];
  branches: Branch[];
  onClose: () => void;
  onSave: (formData: AttendanceFormData, recordId?: string) => Promise<boolean | void> | boolean | void;
  isSubmitting?: boolean;
}) {
  const isEditing = Boolean(initialData);

  const initialName = initialData?.name || initialData?.employeeName || '';
  const [formData, setFormData] = useState<AttendanceFormData>(() => {
    if (initialData) {
      return {
        name: initialName,
        employeeName: initialName,
        department: initialData.department,
        branch: initialData.branch || branches[0] || 'Bannerghatta',
        date: initialData.date,
        checkIn: toTimeInput(initialData.checkIn) || '09:30',
        checkOut: toTimeInput(initialData.checkOut) || '18:30',
        status: initialData.status,
        role: initialData.role || '',
        notes: initialData.notes || '',
        employeeId: initialData.employeeId,
      };
    }
    return {
      name: '',
      employeeName: '',
      department: 'BM',
      branch: branches[0] || 'Bannerghatta',
      date: '2026-11-20',
      checkIn: '09:30',
      checkOut: '18:30',
      status: 'Present',
      role: 'Branch Manager',
      notes: '',
    };
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      checkIn: newStatus === 'Absent' ? '--:--' : prev.checkIn === '--:--' ? '09:00' : prev.checkIn,
      checkOut: newStatus === 'Absent' ? '--:--' : prev.checkOut === '--:--' ? '17:30' : prev.checkOut,
    }));
    setErrors((prev) => ({ ...prev, status: undefined, checkIn: undefined, checkOut: undefined }));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const isAbsent = formData.status === 'Absent';
    const candidateData: AttendanceFormData = {
      ...formData,
      name: formData.name.trim(),
      employeeName: formData.name.trim(),
      checkIn: isAbsent ? '--:--' : formData.checkIn,
      checkOut: isAbsent ? '--:--' : formData.checkOut,
    };

    // Use shared business validation logic
    const validationResult = validateAttendance({
      name: candidateData.name,
      department: candidateData.department,
      branch: candidateData.branch,
      date: candidateData.date,
      status: candidateData.status,
      checkIn: candidateData.checkIn,
      checkOut: candidateData.checkOut,
    });

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    try {
      await onSave(candidateData, initialData?.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save attendance record.';
      setServerError(message);
    }
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
          disabled={isSubmitting}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Error alert banner (e.g. duplicate prevention error) */}
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Record Error</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {/* Employee Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Employee Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value, employeeName: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
                if (serverError) setServerError(null);
              }}
              placeholder="e.g. Sarah Jenkins"
              disabled={isSubmitting}
              className={`w-full pl-9 pr-3 py-2 text-sm bg-white border ${
                errors.name
                  ? 'border-rose-400 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              } rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition-all disabled:bg-slate-50`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Department & Branch Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Role / Designation <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={formData.department}
                disabled={isSubmitting}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    department: val,
                    role: val === 'BM' ? 'Branch Manager' : 'Assistant Branch Manager',
                  });
                  if (errors.department) setErrors({ ...errors, department: undefined });
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:bg-slate-50 font-medium"
              >
                <option value="BM">BM (Branch Manager)</option>
                <option value="ABM">ABM (Assistant Branch Manager)</option>
              </select>
            </div>
            {errors.department && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.department}
              </p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Branch / Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={formData.branch}
                disabled={isSubmitting}
                onChange={(e) => {
                  setFormData({ ...formData, branch: e.target.value });
                  if (errors.branch) setErrors({ ...errors, branch: undefined });
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:bg-slate-50"
              >
                {branches.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>
            </div>
            {errors.branch && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.branch}
              </p>
            )}
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
              disabled={isSubmitting}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (errors.date) setErrors({ ...errors, date: undefined });
                if (serverError) setServerError(null);
              }}
              className={`w-full pl-9 pr-3 py-1.5 sm:py-2 text-sm bg-white border ${
                errors.date
                  ? 'border-rose-400 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              } rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 transition-all cursor-pointer disabled:bg-slate-50`}
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.date}
            </p>
          )}
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
                  disabled={isSubmitting}
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 text-xs rounded-lg border text-center transition-all cursor-pointer disabled:opacity-50 ${
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
          {errors.status && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.status}
            </p>
          )}
        </div>

        {/* Check-In & Check-Out Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Check-in time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Check-in Time (HH:mm){' '}
              {formData.status !== 'Absent' ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-slate-400 font-normal">(Optional for Absent)</span>
              )}
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="time"
                disabled={formData.status === 'Absent' || isSubmitting}
                value={formData.status === 'Absent' ? '' : formData.checkIn}
                onChange={(e) => {
                  setFormData({ ...formData, checkIn: e.target.value });
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
              Check-out Time (HH:mm)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="time"
                disabled={formData.status === 'Absent' || isSubmitting}
                value={formData.status === 'Absent' ? '' : formData.checkOut}
                onChange={(e) => {
                  setFormData({ ...formData, checkOut: e.target.value });
                  if (errors.checkOut) setErrors({ ...errors, checkOut: undefined });
                }}
                className={`w-full pl-9 pr-3 py-1.5 sm:py-2 text-sm bg-white border ${
                  errors.checkOut
                    ? 'border-rose-400 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                } rounded-lg text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-hidden focus:ring-2 transition-all`}
              />
            </div>
            {errors.checkOut && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.checkOut}
              </p>
            )}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Notes / Remarks <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.notes || ''}
            disabled={isSubmitting}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Remote work, client visit, approved leave..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save Attendance'}</span>
              </>
            )}
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
  branches,
  isSubmitting = false,
}: AttendanceModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop click area */}
      <div
        className="fixed inset-0"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Card keyed for auto-resetting state */}
      <AttendanceModalContent
        key={initialData?.id ?? 'create-attendance-modal'}
        initialData={initialData}
        departments={departments}
        branches={branches}
        onClose={onClose}
        onSave={onSave}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
