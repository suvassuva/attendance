'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ArrowLeftRight,
  User,
  Phone,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Attendance, Branch, RelieverDetails } from '@/types/attendance';
import { STAFF_MOVEMENTS, INITIAL_ATTENDANCE_DATA } from '@/lib/dummy-data';

interface ReplaceEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Attendance | null;
  branches: Branch[];
  records?: Attendance[];
  onAssignReliever: (
    absentRecordId: string,
    reliever: RelieverDetails
  ) => Promise<boolean | void> | boolean | void;
  isSubmitting?: boolean;
}

export default function ReplaceEmployeeModal({
  isOpen,
  onClose,
  record,
  branches,
  records,
  onAssignReliever,
  isSubmitting = false,
}: ReplaceEmployeeModalProps) {
  const [relieverName, setRelieverName] = useState('');
  const [relieverPhone, setRelieverPhone] = useState('');
  const [fromBranch, setFromBranch] = useState<string>('');
  const [toBranch, setToBranch] = useState<string>('');
  const [date, setDate] = useState('2026-11-20');
  const [checkIn, setCheckIn] = useState('09:30');
  const [checkOut, setCheckOut] = useState('18:30');
  const [role, setRole] = useState('Reliever Branch Manager');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Autocomplete suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build unified directory of candidates for auto-reflect/suggestions
  const staffCandidates = useMemo(() => {
    const list: Array<{ name: string; branch: string; role: string; isReliever?: boolean }> = [];
    const seenNames = new Set<string>();
    const currentNameLower = record?.name?.toLowerCase().trim() || '';

    // 1. Add known designated relievers first
    STAFF_MOVEMENTS.forEach((m) => {
      const lower = m.name.toLowerCase().trim();
      if (!seenNames.has(lower) && lower !== currentNameLower) {
        seenNames.add(lower);
        list.push({
          name: m.name,
          branch: m.from,
          role: 'Designated Reliever',
          isReliever: true,
        });
      }
    });

    // 2. Add from current live records or dummy database
    const sourceRecords: Attendance[] = records && records.length > 0 ? records : INITIAL_ATTENDANCE_DATA;
    sourceRecords.forEach((r: Attendance) => {
      const name = (r.name || r.employeeName || '').trim();
      if (!name) return;
      const lower = name.toLowerCase();
      if (!seenNames.has(lower) && lower !== currentNameLower) {
        seenNames.add(lower);
        const roleLabel =
          r.role ||
          (r.department === 'ABM' ? 'Assistant Branch Manager' : 'Branch Manager');
        list.push({
          name,
          branch: r.branch || '',
          role: roleLabel,
          isReliever: r.isReliever,
        });
      }
    });

    return list;
  }, [records, record]);

  // Filter candidates matching typed text
  const matchingCandidates = useMemo(() => {
    const query = relieverName.trim().toLowerCase();
    if (!query) {
      return staffCandidates.slice(0, 6);
    }
    return staffCandidates
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.branch && c.branch.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [relieverName, staffCandidates]);

  // Click outside listener to dismiss autocomplete popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize defaults when modal opens with a record
  useEffect(() => {
    if (record) {
      setToBranch(record.branch || branches[0] || 'Bannerghatta');
      setFromBranch(branches[1] || branches[0] || 'Basaveshwara Nagar');
      setDate(record.date || '2026-11-20');
      setRole(
        record.role === 'Assistant Branch Manager' || record.department === 'ABM'
          ? 'Assistant Branch Manager'
          : 'Branch Manager'
      );
      setRelieverName('');
      setRelieverPhone('');
      setNotes(`Reliever assigned covering for ${record.name} (${record.branch})`);
      setError(null);
    }
  }, [record, branches]);

  if (!isOpen || !record) return null;

  const handleSelectPredefinedMovement = (mov: (typeof STAFF_MOVEMENTS)[0]) => {
    setRelieverName(mov.name);
    setRelieverPhone(mov.phone);
    if (branches.includes(mov.from)) {
      setFromBranch(mov.from);
    }
    setNotes(`Reliever ${mov.name} (${mov.from} -> ${toBranch}) covering for ${record.name}`);
    setShowSuggestions(false);
  };

  const handleSelectCandidate = (candidate: { name: string; branch: string; role?: string }) => {
    setRelieverName(candidate.name);
    if (candidate.branch && branches.includes(candidate.branch)) {
      setFromBranch(candidate.branch);
    }
    setNotes(`Reliever ${candidate.name} (${candidate.branch || fromBranch} -> ${toBranch}) covering for ${record.name}`);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || matchingCandidates.length === 0) {
      if (e.key === 'ArrowDown') {
        setShowSuggestions(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < matchingCandidates.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : matchingCandidates.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < matchingCandidates.length) {
        e.preventDefault();
        handleSelectCandidate(matchingCandidates[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!relieverName.trim()) {
      setError('Please provide the reliever or replacement employee name.');
      return;
    }

    try {
      const details: RelieverDetails = {
        relieverName: relieverName.trim(),
        relieverPhone: relieverPhone.trim(),
        fromBranch: fromBranch || branches[0] || 'Bannerghatta',
        toBranch: toBranch || record.branch || 'Bannerghatta',
        date,
        role,
        checkIn,
        checkOut,
        notes: notes.trim(),
      };

      await onAssignReliever(record.id, details);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to assign reliever:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign reliever');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Replace Employee / Assign Reliever
              </h3>
              <p className="text-xs text-slate-500">
                Assign a substitute to cover duties for this branch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Currently Assigned Staff Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center">
                {record.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Staff being covered / replaced
                </p>
                <p className="text-sm font-bold text-slate-900">{record.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{record.role || 'Branch Staff'}</span>
                  <span>•</span>
                  <span>{record.branch}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  record.status === 'Absent'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {record.status}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Reliever Suggestions */}
          {STAFF_MOVEMENTS.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Select from Available Reliever Staff:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STAFF_MOVEMENTS.slice(0, 6).map((mov, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPredefinedMovement(mov)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    {mov.name} ({mov.from})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reliever Name with Autocomplete / Auto-Reflect */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Replacement / Reliever Name <span className="text-rose-500">*</span>
              </label>
              {showSuggestions && matchingCandidates.length > 0 && (
                <span className="text-[11px] text-blue-600 font-medium">
                  {matchingCandidates.length} staff found
                </span>
              )}
            </div>

            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                autoComplete="off"
                value={relieverName}
                onChange={(e) => {
                  setRelieverName(e.target.value);
                  setShowSuggestions(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Type name (e.g. Sikindar, Sunil, Arun, Ramesh)..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Auto-Reflect Dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Available Staff & Relievers</span>
                  <span className="text-[10px] lowercase font-normal text-slate-400">Click to auto-fill</span>
                </div>

                {matchingCandidates.length > 0 ? (
                  <ul className="divide-y divide-slate-100 py-1" role="listbox">
                    {matchingCandidates.map((cand, idx) => (
                      <li
                        key={`${cand.name}_${cand.branch}_${idx}`}
                        role="option"
                        aria-selected={idx === highlightedIndex}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCandidate(cand);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                          idx === highlightedIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              cand.isReliever ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {cand.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {cand.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                              {cand.branch && <span>{cand.branch}</span>}
                              {cand.branch && cand.role && <span>•</span>}
                              {cand.role && <span>{cand.role}</span>}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            cand.isReliever
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cand.isReliever ? 'Reliever' : cand.role || 'Staff'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No registered staff found matching &ldquo;{relieverName}&rdquo;. You can still use this as a custom name.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* From Branch and Target Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reliever Home Branch (From)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={fromBranch}
                  onChange={(e) => setFromBranch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Deputed Branch (Covering At)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={toBranch}
                  onChange={(e) => setToBranch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date & Duty Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Relief Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Check In
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Check Out
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deputation Remarks / Reason
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Covering BM leave with approval"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning Reliever...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Reliever / Replacement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

