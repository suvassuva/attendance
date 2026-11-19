'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Attendance } from '@/types/attendance';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: Attendance | null;
  isDeleting?: boolean;
}

export default function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  record,
  isDeleting = false,
}: DeleteConfirmationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !record) return null;

  const displayName = record.name || record.employeeName || 'Unknown Employee';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={() => !isDeleting && onClose()} aria-hidden="true" />

      {/* Confirmation Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                  Delete Attendance Record
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to delete the attendance entry for{' '}
                <strong className="text-slate-900 font-semibold">{displayName}</strong> on{' '}
                <strong className="text-slate-900 font-semibold">{record.date}</strong>?
              </p>

              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-medium text-slate-700">{record.employeeId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-medium text-slate-700">{record.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded Status:</span>
                  <span className="font-medium text-slate-700">{record.status}</span>
                </div>
              </div>

              <p className="text-xs text-rose-600 mt-2.5 font-medium">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
