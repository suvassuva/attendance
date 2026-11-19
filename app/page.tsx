'use client';

import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import AttendanceFilters from '@/components/AttendanceFilters';
import AttendanceTable from '@/components/AttendanceTable';
import AttendanceModal from '@/components/AttendanceModal';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { DEPARTMENTS, INITIAL_ATTENDANCE_DATA } from '@/lib/dummy-data';
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
  // Main attendance records state initialized from seed data
  const [records, setRecords] = useState<Attendance[]>(INITIAL_ATTENDANCE_DATA);

  // Async loading & submission states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

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

  // Sync initial load with backend service
  useEffect(() => {
    let active = true;
    attendanceService
      .getAttendanceRecords()
      .then((data) => {
        if (active) {
          setRecords(data);
        }
      })
      .catch((err) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Failed to load attendance records';
          showToast(msg, 'error');
        }
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  // Update KPI statistics whenever records or target date changes
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
    setIsLoading(true);
    setFilters({
      searchQuery: '',
      department: '',
      status: '',
      date: '',
    });
    setTimeout(() => {
      setIsLoading(false);
      showToast('Filters reset to default view', 'info');
    }, 200);
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

  // Save (Create or Update) handler with duplicate check and validation
  const handleSaveAttendance = async (formData: AttendanceFormData, recordId?: string) => {
    setIsSaving(true);
    try {
      if (recordId) {
        // Update existing record via business service
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

        startTransition(() => {
          setRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
        });

        setIsModalOpen(false);
        setEditingRecord(null);
        showToast(`Attendance record updated for ${updated.name}`);
      } else {
        // Create new record via business service (includes duplicate prevention)
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

        startTransition(() => {
          setRecords((prev) => [created, ...prev]);
        });

        setIsModalOpen(false);
        setEditingRecord(null);
        showToast(`Attendance recorded for ${created.name}`);
      }
    } catch (error) {
      if (error instanceof DuplicateAttendanceError) {
        showToast(error.message, 'error');
      }
      // Re-throw so modal form can display field-specific error banner if needed
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handlers
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

      startTransition(() => {
        setRecords((prev) => prev.filter((r) => r.id !== targetId));
      });

      setRecordToDelete(null);
      showToast(`Record for ${deletedName} deleted`, 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete attendance record';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
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

        {/* Dashboard Title & Quick Stats Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Overview & Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Real-time monitoring of team attendance, punctuality, and daily leaves.
            </p>
          </div>

          {/* Quick Date Presets */}
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
