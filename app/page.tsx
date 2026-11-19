'use client';

import React, { useState, useMemo, useTransition } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  CheckCircle2,
} from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import AttendanceFilters from '@/components/AttendanceFilters';
import AttendanceTable from '@/components/AttendanceTable';
import AttendanceModal from '@/components/AttendanceModal';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { INITIAL_ATTENDANCE_DATA, DEPARTMENTS } from '@/lib/dummy-data';
import {
  AttendanceRecord,
  AttendanceFiltersState,
  AttendanceFormData,
} from '@/types/attendance';

export default function AttendanceDashboardPage() {
  // Main attendance state
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AttendanceFiltersState>({
    searchQuery: '',
    department: '',
    status: '',
    date: '2026-11-19', // Default to current date for today's roster
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Delete dialog state
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  // User notification banner
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

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
    }, 250);
  };

  // Dynamic KPI calculation based on current date context or records
  const kpiStats = useMemo(() => {
    // Determine the relevant date context for "Today"
    const targetDate = filters.date || '2026-11-19';
    const dayRecords = records.filter((r) => r.date === targetDate);

    // If date is set to "All", calculate on all records, else calculate for targeted date
    const contextRecords = filters.date ? dayRecords : records;

    const totalInContext = contextRecords.length;
    const presentCount = contextRecords.filter((r) => r.status === 'Present').length;
    const lateCount = contextRecords.filter((r) => r.status === 'Late').length;
    const absentCount = contextRecords.filter((r) => r.status === 'Absent').length;
    const halfDayCount = contextRecords.filter((r) => r.status === 'Half-Day').length;

    // Total unique employees known in system
    const uniqueEmployeeIds = new Set(records.map((r) => r.employeeId || r.employeeName));
    const totalEmployeesCount = uniqueEmployeeIds.size;

    // Percentages
    const presentRate =
      totalInContext > 0 ? Math.round(((presentCount + halfDayCount) / totalInContext) * 100) : 0;
    const lateRate =
      totalInContext > 0 ? Math.round((lateCount / totalInContext) * 100) : 0;
    const absentRate =
      totalInContext > 0 ? Math.round((absentCount / totalInContext) * 100) : 0;

    return {
      totalEmployees: totalEmployeesCount,
      presentToday: presentCount,
      lateToday: lateCount,
      absentToday: absentCount,
      presentRate,
      lateRate,
      absentRate,
      contextCount: totalInContext,
      targetDate,
    };
  }, [records, filters.date]);

  // Filtered records matching search, department, status, and date
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = record.employeeName.toLowerCase().includes(query);
        const matchesId = record.employeeId?.toLowerCase().includes(query);
        const matchesEmail = record.email?.toLowerCase().includes(query);
        const matchesDept = record.department.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesEmail && !matchesDept) {
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
  const handleOpenEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  // Save (Create or Update) handler
  const handleSaveAttendance = (formData: AttendanceFormData, recordId?: string) => {
    startTransition(() => {
      if (recordId) {
        // Edit existing record
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  employeeName: formData.employeeName,
                  department: formData.department,
                  date: formData.date,
                  checkIn: formData.checkIn,
                  checkOut: formData.checkOut,
                  status: formData.status,
                  notes: formData.notes,
                }
              : r
          )
        );
        showToast(`Attendance updated for ${formData.employeeName}`);
      } else {
        // Create new record
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          employeeName: formData.employeeName,
          email: `${formData.employeeName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          department: formData.department,
          date: formData.date,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          status: formData.status,
          notes: formData.notes,
        };

        setRecords((prev) => [newRecord, ...prev]);
        showToast(`Attendance recorded for ${formData.employeeName}`);
      }
    });

    setIsModalOpen(false);
    setEditingRecord(null);
  };

  // Delete handlers
  const handlePromptDelete = (record: AttendanceRecord) => {
    setRecordToDelete(record);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    const deletedName = recordToDelete.employeeName;

    setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
    setRecordToDelete(null);
    showToast(`Record for ${deletedName} deleted`, 'info');
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
          <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs sm:text-sm shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-blue-500 hover:text-blue-700 text-xs font-semibold px-2"
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
            isLoading={isLoading || isPending}
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
      />

      {/* 6. Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
        record={recordToDelete}
      />
    </div>
  );
}
