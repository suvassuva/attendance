'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ArrowLeftRight,
  User,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Send,
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
  // Two operational modes:
  // 1. 'deploy_as_reliever': The clicked person IS the reliever, deploying them to a branch.
  // 2. 'assign_for_absent': The clicked person is absent, assigning a reliever to cover them.
  const [mode, setMode] = useState<'deploy_as_reliever' | 'assign_for_absent'>('deploy_as_reliever');

  // Reliever & deployment state
  const [selectedRelieverName, setSelectedRelieverName] = useState('');
  const [selectedRelieverBranch, setSelectedRelieverBranch] = useState('');
  const [customRelieverMode, setCustomRelieverMode] = useState(false);

  // Target destination branch & absent person being covered
  const [targetBranch, setTargetBranch] = useState<string>('');
  const [coveringForName, setCoveringForName] = useState<string>('');
  const [targetAbsentId, setTargetAbsentId] = useState<string>('');

  const [date, setDate] = useState('2026-11-20');
  const [checkIn, setCheckIn] = useState('09:30');
  const [checkOut, setCheckOut] = useState('18:30');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Predefined designated relievers pool
  const designatedRelievers = useMemo(() => {
    return STAFF_MOVEMENTS.map((m) => ({
      name: m.name,
      branch: m.from,
      role: 'Designated Reliever',
      phone: m.phone,
    }));
  }, []);

  // List of all currently absent employees
  const absentStaffList = useMemo(() => {
    const source: Attendance[] = records && records.length > 0 ? records : INITIAL_ATTENDANCE_DATA;
    return source.filter((r) => r.status === 'Absent' && r.id !== record?.id);
  }, [records, record]);

  // Unified list of all available staff who can act as relievers
  const availableRelieverStaff = useMemo(() => {
    const list: Array<{ name: string; branch: string; role: string; isReliever?: boolean }> = [];
    const seen = new Set<string>();
    const currentNameLower = record?.name?.toLowerCase().trim() || '';

    // Add designated relievers
    designatedRelievers.forEach((m) => {
      const lower = m.name.toLowerCase().trim();
      if (!seen.has(lower) && lower !== currentNameLower) {
        seen.add(lower);
        list.push({ ...m, isReliever: true });
      }
    });

    // Add all BM / ABM staff
    const source: Attendance[] = records && records.length > 0 ? records : INITIAL_ATTENDANCE_DATA;
    source.forEach((r) => {
      const name = (r.name || r.employeeName || '').trim();
      if (!name) return;
      const lower = name.toLowerCase();
      if (!seen.has(lower) && lower !== currentNameLower) {
        seen.add(lower);
        list.push({
          name,
          branch: r.branch || '',
          role: r.role || (r.department === 'ABM' ? 'ABM' : 'BM'),
          isReliever: r.isReliever,
        });
      }
    });

    return list;
  }, [designatedRelievers, records, record]);

  // When modal opens, intelligently default mode and values based on the clicked record
  useEffect(() => {
    if (record) {
      setError(null);
      setDate(record.date || '2026-11-20');
      setCheckIn('09:30');
      setCheckOut('18:30');
      setCustomRelieverMode(false);

      if (record.status === 'Absent') {
        // Mode: Assign a reliever for this absent employee
        setMode('assign_for_absent');
        setTargetBranch(record.branch || branches[0] || 'Bannerghatta');
        setCoveringForName(record.name);
        setTargetAbsentId(record.id);

        // Pre-select first designated reliever
        const firstReliever = designatedRelievers[0];
        if (firstReliever) {
          setSelectedRelieverName(firstReliever.name);
          setSelectedRelieverBranch(firstReliever.branch);
          setNotes(`Reliever ${firstReliever.name} (${firstReliever.branch} -> ${record.branch}) covering for ${record.name}`);
        }
      } else {
        // Mode: The clicked employee IS the reliever being deployed to another branch!
        setMode('deploy_as_reliever');
        setSelectedRelieverName(record.name);
        setSelectedRelieverBranch(record.branch || branches[0] || 'Bannerghatta');

        // Pick the first absent employee branch if available, else next branch
        if (absentStaffList.length > 0) {
          const firstAbsent = absentStaffList[0];
          setTargetBranch(firstAbsent.branch || branches[1] || 'Rajajinagar');
          setCoveringForName(firstAbsent.name);
          setTargetAbsentId(firstAbsent.id);
          setNotes(`Reliever ${record.name} (${record.branch} -> ${firstAbsent.branch}) covering for ${firstAbsent.name}`);
        } else {
          const nextBranch = branches.find((b) => b !== record.branch) || branches[0];
          setTargetBranch(nextBranch);
          setCoveringForName('General Support / Handover');
          setTargetAbsentId(record.id);
          setNotes(`Reliever ${record.name} (${record.branch} -> ${nextBranch}) inter-branch support`);
        }
      }
    }
  }, [record, branches, designatedRelievers, absentStaffList]);

  if (!isOpen || !record) return null;

  // Handle Mode Switch
  const handleSwitchMode = (newMode: 'deploy_as_reliever' | 'assign_for_absent') => {
    setMode(newMode);
    setError(null);

    if (newMode === 'deploy_as_reliever') {
      setSelectedRelieverName(record.name);
      setSelectedRelieverBranch(record.branch || branches[0]);
      if (absentStaffList.length > 0) {
        setTargetBranch(absentStaffList[0].branch || branches[1]);
        setCoveringForName(absentStaffList[0].name);
        setTargetAbsentId(absentStaffList[0].id);
      } else {
        setTargetBranch(branches[1] || branches[0]);
        setCoveringForName('General Branch Support');
        setTargetAbsentId(record.id);
      }
      setNotes(`Reliever ${record.name} deployed from ${record.branch}`);
    } else {
      setTargetBranch(record.branch || branches[0]);
      setCoveringForName(record.name);
      setTargetAbsentId(record.id);
      const firstReliever = designatedRelievers[0];
      if (firstReliever) {
        setSelectedRelieverName(firstReliever.name);
        setSelectedRelieverBranch(firstReliever.branch);
        setNotes(`Reliever ${firstReliever.name} assigned covering for ${record.name}`);
      }
    }
  };

  // Handle selection of reliever in 'assign_for_absent' mode
  const handleSelectReliever = (reliever: { name: string; branch: string }) => {
    setSelectedRelieverName(reliever.name);
    setSelectedRelieverBranch(reliever.branch);
    setCustomRelieverMode(false);
    setNotes(`Reliever ${reliever.name} (${reliever.branch} -> ${targetBranch}) covering for ${coveringForName}`);
  };

  // Handle selecting which absent employee to cover in 'deploy_as_reliever' mode
  const handleSelectAbsentTarget = (absentStaff: Attendance | null) => {
    if (absentStaff) {
      setCoveringForName(absentStaff.name);
      setTargetBranch(absentStaff.branch || branches[0]);
      setTargetAbsentId(absentStaff.id);
      setNotes(`Reliever ${selectedRelieverName} (${selectedRelieverBranch} -> ${absentStaff.branch}) covering for ${absentStaff.name}`);
    } else {
      setCoveringForName('General Support / Branch Handover');
      setTargetAbsentId(record.id);
      setNotes(`Reliever ${selectedRelieverName} (${selectedRelieverBranch} -> ${targetBranch}) support duty`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const relieverNameToUse = selectedRelieverName.trim();
    if (!relieverNameToUse) {
      setError('Please select or enter the reliever name.');
      return;
    }

    try {
      const details: RelieverDetails = {
        relieverName: relieverNameToUse,
        fromBranch: selectedRelieverBranch || branches[0],
        toBranch: targetBranch || record.branch || branches[0],
        date,
        role: 'Reliever Branch Manager',
        checkIn,
        checkOut,
        notes: notes.trim(),
      };

      const finalAbsentId = targetAbsentId || record.id;
      await onAssignReliever(finalAbsentId, details);
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Reliever & Deputation Assignment
              </h3>
              <p className="text-xs text-slate-500">
                Manage branch staff replacement and reliever deployment
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

        {/* Mode Selector Tabs (Clear choice between Deploying vs Replacing) */}
        <div className="p-4 pb-0 bg-slate-50/40">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => handleSwitchMode('deploy_as_reliever')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'deploy_as_reliever'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Deploy <strong>{record.name}</strong> as Reliever</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('assign_for_absent')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'assign_for_absent'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Assign Reliever for <strong>{record.name}</strong></span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 1: The clicked person IS the Reliever (deploy_as_reliever) */}
          {/* ========================================================================= */}
          {mode === 'deploy_as_reliever' ? (
            <div className="space-y-4">
              {/* Confirmed Reliever Banner (NEVER asks for reliever name again!) */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-bold text-sm flex items-center justify-center">
                    {record.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
                      Reliever on Duty
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{record.name}</p>
                    <p className="text-xs text-slate-500">Home Branch: {record.branch}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    Ready to Depute
                  </span>
                </div>
              </div>

              {/* Where to send this reliever? */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Branch to Depute To <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={targetBranch}
                      onChange={(e) => {
                        setTargetBranch(e.target.value);
                        setNotes(`Reliever ${record.name} (${record.branch} -> ${e.target.value})`);
                      }}
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
                    Covering for (Absent Employee)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={targetAbsentId}
                      onChange={(e) => {
                        const sel = absentStaffList.find((a) => a.id === e.target.value);
                        handleSelectAbsentTarget(sel || null);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                      <option value="">General Support / No Specific Person</option>
                      {absentStaffList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.branch} - Absent)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* MODE 2: The clicked person is Absent (assign_for_absent) */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Absent Staff Being Covered */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-200 text-rose-800 font-bold text-sm flex items-center justify-center">
                    {record.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-full">
                      Absent Staff
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{record.name}</p>
                    <p className="text-xs text-slate-500">Branch: {record.branch}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-lg">
                  Needs Reliever
                </span>
              </div>

              {/* Single Clear Reliever Selector (No redundant re-asking of name!) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Select Reliever Staff</span>
                  <button
                    type="button"
                    onClick={() => setCustomRelieverMode(!customRelieverMode)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    {customRelieverMode ? 'Choose from list' : '+ Type custom name'}
                  </button>
                </label>

                {!customRelieverMode ? (
                  <div className="space-y-2">
                    {/* Quick 1-Click Cards for Designated Relievers */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {designatedRelievers.map((rel) => {
                        const isSelected = selectedRelieverName === rel.name;
                        return (
                          <button
                            key={rel.name}
                            type="button"
                            onClick={() => handleSelectReliever(rel)}
                            className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100 text-blue-900 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                          >
                            <p className="font-bold truncate flex items-center justify-between">
                              <span>{rel.name}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{rel.branch}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* All other available staff dropdown */}
                    <div className="mt-2">
                      <select
                        value={selectedRelieverName}
                        onChange={(e) => {
                          const found = availableRelieverStaff.find((s) => s.name === e.target.value);
                          if (found) handleSelectReliever(found);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">Or select from all other branch staff...</option>
                        {availableRelieverStaff.map((staff) => (
                          <option key={`${staff.name}_${staff.branch}`} value={staff.name}>
                            {staff.name} ({staff.branch || 'Bangalore'} • {staff.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={selectedRelieverName}
                      onChange={(e) => setSelectedRelieverName(e.target.value)}
                      placeholder="Type custom reliever name..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shift Times & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500"
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500"
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Deputation Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deputation Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reliever covering duties"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {mode === 'deploy_as_reliever'
                      ? `Deploy ${record.name} to ${targetBranch}`
                      : `Confirm Reliever: ${selectedRelieverName || 'Staff'}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
