import {
  Attendance,
  AttendanceFiltersState,
  AttendanceStats,
  CreateAttendanceDTO,
  UpdateAttendanceDTO,
} from '@/types/attendance';
import { INITIAL_ATTENDANCE_DATA } from '@/lib/dummy-data';
import {
  checkDuplicateAttendance,
  calculateAttendanceStats,
  filterAttendanceRecords,
  formatToHHmm,
  searchAttendance,
} from './attendance-utils';
import {
  validateAttendanceOrThrow,
} from './attendance-validation';

export class DuplicateAttendanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateAttendanceError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * AttendanceService:
 * Modular, production-ready service encapsulating all data operations, business rules,
 * validation, and duplicate prevention.
 *
 * NOTE FOR PHASE 3 FIREBASE INTEGRATION:
 * The data access points in this service are mapped cleanly to Firestore operations:
 * - getAttendanceRecords -> getDocs(query(collection(db, 'attendance'), ...))
 * - getAttendanceById    -> getDoc(doc(db, 'attendance', id))
 * - createAttendance     -> addDoc(collection(db, 'attendance'), data)
 * - updateAttendance     -> updateDoc(doc(db, 'attendance', id), data)
 * - deleteAttendance     -> deleteDoc(doc(db, 'attendance', id))
 */
class AttendanceService {
  // In-memory data store initialized from seed data
  private records: Attendance[] = INITIAL_ATTENDANCE_DATA.map((item) => ({
    ...item,
    name: item.name || item.employeeName || 'Unknown Employee',
    checkIn: formatToHHmm(item.checkIn),
    checkOut: formatToHHmm(item.checkOut),
    createdAt: item.createdAt || new Date('2026-11-19T08:00:00Z').toISOString(),
  }));

  /**
   * Retrieves all records, optionally filtered by search, department, status, and date.
   */
  async getAttendanceRecords(filters?: Partial<AttendanceFiltersState>): Promise<Attendance[]> {
    let result = [...this.records];

    if (filters) {
      const fullFilters: AttendanceFiltersState = {
        searchQuery: filters.searchQuery || '',
        department: filters.department || '',
        status: filters.status || '',
        date: filters.date || '',
      };
      result = filterAttendanceRecords(result, fullFilters);
    }

    // Sort by date descending, then name ascending
    return result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Retrieves a single attendance record by ID.
   */
  async getAttendanceById(id: string): Promise<Attendance | null> {
    const record = this.records.find((r) => r.id === id);
    return record ? { ...record } : null;
  }

  /**
   * Searches records matching a query text.
   */
  async searchAttendance(query: string): Promise<Attendance[]> {
    return searchAttendance(this.records, query);
  }

  /**
   * Creates a new attendance record with validation and duplicate prevention.
   */
  async createAttendance(data: CreateAttendanceDTO): Promise<Attendance> {
    const candidateName = (data.name ?? data.employeeName ?? '').trim();

    // 1. Validate payload
    validateAttendanceOrThrow({
      ...data,
      name: candidateName,
    });

    // 2. Prevent duplicate entries for the same employee on the same date
    const dupCheck = checkDuplicateAttendance(this.records, {
      name: candidateName,
      date: data.date,
      employeeId: data.employeeId,
    });

    if (dupCheck.isDuplicate) {
      throw new DuplicateAttendanceError(
        dupCheck.message || `An attendance record for "${candidateName}" on ${data.date} already exists.`
      );
    }

    // 3. Format and store
    const isAbsent = data.status === 'Absent';
    const newRecord: Attendance = {
      id: data.id || `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: candidateName,
      employeeName: candidateName,
      employeeId: data.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: data.email || `${candidateName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      department: data.department,
      date: data.date.trim(),
      checkIn: isAbsent ? '--:--' : formatToHHmm(data.checkIn),
      checkOut: isAbsent ? '--:--' : formatToHHmm(data.checkOut),
      status: data.status,
      notes: data.notes?.trim() || '',
      createdAt: data.createdAt || new Date().toISOString(),
    };

    // Prepend to maintain reverse chronological order
    this.records = [newRecord, ...this.records];

    return { ...newRecord };
  }

  /**
   * Updates an existing attendance record with validation and duplicate check.
   */
  async updateAttendance(id: string, data: UpdateAttendanceDTO): Promise<Attendance> {
    const existingIndex = this.records.findIndex((r) => r.id === id);
    if (existingIndex === -1) {
      throw new NotFoundError(`Attendance record with ID "${id}" was not found.`);
    }

    const currentRecord = this.records[existingIndex];
    const candidateName = (data.name ?? data.employeeName ?? currentRecord.name).trim();
    const candidateDate = (data.date ?? currentRecord.date).trim();
    const candidateStatus = data.status ?? currentRecord.status;
    const isAbsent = candidateStatus === 'Absent';

    // 1. Validate combined data
    validateAttendanceOrThrow({
      ...currentRecord,
      ...data,
      name: candidateName,
      date: candidateDate,
      status: candidateStatus,
    });

    // 2. Check for duplicate if name, date, or employeeId changed
    const dupCheck = checkDuplicateAttendance(this.records, {
      id,
      name: candidateName,
      date: candidateDate,
      employeeId: data.employeeId ?? currentRecord.employeeId,
    });

    if (dupCheck.isDuplicate) {
      throw new DuplicateAttendanceError(
        dupCheck.message || `An attendance record for "${candidateName}" on ${candidateDate} already exists.`
      );
    }

    // 3. Update record
    const updatedRecord: Attendance = {
      ...currentRecord,
      ...data,
      name: candidateName,
      employeeName: candidateName,
      date: candidateDate,
      status: candidateStatus,
      checkIn: isAbsent ? '--:--' : formatToHHmm(data.checkIn ?? currentRecord.checkIn),
      checkOut: isAbsent ? '--:--' : formatToHHmm(data.checkOut ?? currentRecord.checkOut),
    };

    this.records[existingIndex] = updatedRecord;

    return { ...updatedRecord };
  }

  /**
   * Deletes an attendance record by ID.
   */
  async deleteAttendance(id: string): Promise<boolean> {
    const existingIndex = this.records.findIndex((r) => r.id === id);
    if (existingIndex === -1) {
      throw new NotFoundError(`Attendance record with ID "${id}" was not found.`);
    }

    this.records = this.records.filter((r) => r.id !== id);
    return true;
  }

  /**
   * Calculates KPI metrics dynamically based on current records.
   */
  async calculateStatistics(targetDate?: string): Promise<AttendanceStats> {
    return calculateAttendanceStats(this.records, targetDate);
  }

  /**
   * Resets the service records back to initial mock data (useful for testing/demo).
   */
  async resetToSeedData(): Promise<void> {
    this.records = INITIAL_ATTENDANCE_DATA.map((item) => ({
      ...item,
      name: item.name || item.employeeName || 'Unknown Employee',
      checkIn: formatToHHmm(item.checkIn),
      checkOut: formatToHHmm(item.checkOut),
      createdAt: item.createdAt || new Date('2026-11-19T08:00:00Z').toISOString(),
    }));
  }
}

// Singleton instance export
export const attendanceService = new AttendanceService();

// Reusable individual function exports for flexible composition
export const getAttendanceRecords = (filters?: Partial<AttendanceFiltersState>) =>
  attendanceService.getAttendanceRecords(filters);

export const getAttendanceById = (id: string) =>
  attendanceService.getAttendanceById(id);

export const createAttendance = (data: CreateAttendanceDTO) =>
  attendanceService.createAttendance(data);

export const updateAttendance = (id: string, data: UpdateAttendanceDTO) =>
  attendanceService.updateAttendance(id, data);

export const deleteAttendance = (id: string) =>
  attendanceService.deleteAttendance(id);

export const searchAttendanceRecords = (query: string) =>
  attendanceService.searchAttendance(query);

export const calculateAttendanceStatistics = (targetDate?: string) =>
  attendanceService.calculateStatistics(targetDate);
