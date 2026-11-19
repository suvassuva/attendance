'use client';

import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import AttendanceFilters from '@/components/AttendanceFilters';
import AttendanceTable from '@/components/AttendanceTable';
import AttendanceModal from '@/components/AttendanceModal';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { DEPARTMENTS } from '@/lib/dummy-data';
import {
  Attendance,
  AttendanceFiltersState,
  AttendanceFormData,
} from '@/types/attendance';
import {
  attendanceService,
  DuplicateAttendanceError,
} from '@/lib/attendance/attendance-service';
import { calculateAttendanceStats } from '@/lib/attendance/attendance-utils';

export default function AttendanceDashboardPage() {
  // Main attendance records state
  const [records, setRecords] = useState<Attendance[]>([]);

  // Async loading & submission states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [, startTransition] = useTransition();

  // Live Firestore detection
  const isLiveFirestore = attendanceService.isLiveFirestore();

  // Filter state
  const [filters, setFilters] = useState<AttendanceFiltersState>({
    searchQuery: '',
    department: '',
    status: '',
    date: '2026-11-19', // Default to current date for today's roster
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);

  // Delete dialog state
  const [recordToDelete, setRecordToDelete] = useState<Attendance | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // 3. Real-Time Data Synchronization using Firestore onSnapshot
  useEffect(() => {
    const unsubscribe = attendanceService.subscribeToAttendance(
      (updatedRecords) => {
        setRecords(updatedRecords);
        setIsLoading(false);
      },
      (error) => {
        console.error('Realtime Firestore synchronization error:', error);
        setIsLoading(false);
        showToast(`Firestore Sync Notice: ${error.message}`, 'error');
      }
    );

    // Clean up listener when component unmounts
    return () => {
      unsubscribe();
    };
  }, [showToast]);

  // Update KPI statistics automatically whenever records or target date changes
  const kpiStats = useMemo(() => {
    return calculateAttendanceStats(records, filters.date || undefined);
  }, [records, filters.date]);

  // Filter change handler
  const handleFilterChange = <K extends keyof AttendanceFiltersState>(
    key: K,
    value: AttendanceFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      department: '',
      status: '',
      date: '',
    });
    showToast('Filters reset to default view', 'info');
  };

  // Filtered records matching active filters
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const displayName = (record.name || record.employeeName || '').toLowerCase();
        const id = (record.employeeId || '').toLowerCase();
        const email = (record.email || '').toLowerCase();
        const dept = (record.department || '').toLowerCase();
        if (!displayName.includes(query) && !id.includes(query) && !email.includes(query) && !dept.includes(query)) {
          return false;
        }
      }

      // 2. Department
      if (filters.department && record.department !== filters.department) {
        return false;
      }

      // 3. Status
      if (filters.status && record.status !== filters.status) {
        return false;
      }

      // 4. Date
      if (filters.date && record.date !== filters.date) {
        return false;
      }

      return true;
    });
  }, [records, filters]);

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (record: Attendance) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  // 4. CRUD Operations - Create & Update with Firestore Transaction / Duplicate Check
  const handleSaveAttendance = async (formData: AttendanceFormData, recordId?: string) => {
    setIsSaving(true);
    try {
      if (recordId) {
        // Update existing record
        const updated = await attendanceService.updateAttendance(recordId, {
          name: formData.name,
          employeeName: formData.name,
          department: formData.department,
          date: formData.date,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          status: formData.status,
          notes: formData.notes,
        });

        // If local fallback, update state optimistically
        if (!attendanceService.isLiveFirestore()) {
          startTransition(() => {
            setRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
          });
        }

        setIsModalOpen(false);
        setEditingRecord(null);
        showToast(`Attendance updated for ${updated.name}`);
      } else {
        // Create new record with transactional duplicate prevention
        const created = await attendanceService.createAttendance({
          name: formData.name,
          employeeName: formData.name,
          department: formData.department,
          date: formData.date,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          status: formData.status,
          notes: formData.notes,
        });

        // If local fallback, update state optimistically
        if (!attendanceService.isLiveFirestore()) {
          startTransition(() => {
            setRecords((prev) => [created, ...prev]);
          });
        }

        setIsModalOpen(false);
        setEditingRecord(null);
        showToast(`Attendance recorded for ${created.name}`);
      }
    } catch (error) {
      if (error instanceof DuplicateAttendanceError) {
        showToast(error.message, 'error');
      } else {
        const msg = error instanceof Error ? error.message : 'Failed to save attendance record.';
        showToast(msg, 'error');
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 4. CRUD Operations - Delete with Confirmation Dialog
  const handlePromptDelete = (record: Attendance) => {
    setRecordToDelete(record);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    const deletedName = recordToDelete.name || recordToDelete.employeeName || 'Employee';
    const targetId = recordToDelete.id;

    setIsDeleting(true);
    try {
      await attendanceService.deleteAttendance(targetId);

      // If local fallback, update state optimistically
      if (!attendanceService.isLiveFirestore()) {
        startTransition(() => {
          setRecords((prev) => prev.filter((r) => r.id !== targetId));
        });
      }

      setRecordToDelete(null);
      showToast(`Record for ${deletedName} deleted`, 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete attendance record';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Seed sample data helper for Firestore
  const handleSeedFirestore = async () => {
    setIsSeeding(true);
    try {
      const result = await attendanceService.seedFirestoreWithSampleData();
      showToast(`Successfully seeded ${result.count} attendance records into Cloud Firestore!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to seed sample records';
      showToast(msg, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header */}
      <Header
        onAddClick={handleOpenAddModal}
        searchQuery={filters.searchQuery}
        onSearchChange={(val) => handleFilterChange('searchQuery', val)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div
            className={`flex items-center justify-between p-3.5 border rounded-xl text-xs sm:text-sm shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toastMessage.type === 'info'
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-semibold px-2 cursor-pointer hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Title, Database Sync Indicator & Quick Date Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Overview & Analytics
              </h2>
              {/* Firestore Real-Time Sync Indicator */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  isLiveFirestore
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLiveFirestore ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                  }`}
                />
                {isLiveFirestore ? 'Firestore Real-Time Sync' : 'Local Fallback Mode'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Real-time monitoring of team attendance, punctuality, and daily leaves.
            </p>
          </div>

          {/* Quick Date Presets & Seed Action */}
          <div className="flex items-center gap-2 flex-wrap">
            {isLiveFirestore && records.length === 0 && (
              <button
                type="button"
                onClick={handleSeedFirestore}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSeeding ? 'Seeding Firestore...' : 'Seed Sample Data'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleFilterChange('date', '2026-11-19')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  filters.date === '2026-11-19'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('date', '2026-11-18')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  filters.date === '2026-11-18'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('date', '')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  filters.date === ''
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All Records
              </button>
            </div>
          </div>
        </div>

        {/* 2. KPI Cards Grid */}
        <section aria-label="Key Performance Indicators">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {/* 1. Total Employees */}
            <StatsCard
              title="Total Employees"
              label="Total Employees"
              value={kpiStats.totalEmployees}
              description={`${DEPARTMENTS.length} active departments`}
              icon={Users}
              variant="blue"
              badgeText="Active"
            />

            {/* 2. Present Today */}
            <StatsCard
              title="Present Today"
              label="Present Today"
              value={kpiStats.presentToday}
              description={`${kpiStats.presentRate}% on-duty attendance`}
              icon={UserCheck}
              variant="green"
              badgeText="On duty"
            />

            {/* 3. Late Today */}
            <StatsCard
              title="Late Today"
              label="Late Today"
              value={kpiStats.lateToday}
              description="Checked in after 09:30 AM"
              icon={Clock}
              variant="amber"
              badgeText="Delayed"
            />

            {/* 4. Absent Today */}
            <StatsCard
              title="Absent Today"
              label="Absent Today"
              value={kpiStats.absentToday}
              description={`${kpiStats.absentRate}% leaves & absences`}
              icon={UserX}
              variant="red"
              badgeText="Unavailable"
            />
          </div>
        </section>

        {/* 3. Filters Section */}
        <section aria-label="Filters and Search">
          <AttendanceFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            departments={DEPARTMENTS}
            totalResults={filteredRecords.length}
            totalRecords={records.length}
          />
        </section>

        {/* 4. Attendance Table Section */}
        <section aria-label="Attendance Records Table" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Employee Attendance Log
            </h3>
            <span className="text-xs text-slate-500">
              {filters.date ? `Showing records for ${filters.date}` : 'Showing all historic records'}
            </span>
          </div>

          <AttendanceTable
            records={filteredRecords}
            isLoading={isLoading}
            onEdit={handleOpenEditModal}
            onDelete={handlePromptDelete}
            onResetFilters={handleResetFilters}
            onAddNew={handleOpenAddModal}
          />
        </section>
      </main>

      {/* 5. Add / Edit Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveAttendance}
        initialData={editingRecord}
        departments={DEPARTMENTS}
        isSubmitting={isSaving}
      />

      {/* 6. Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
        record={recordToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
