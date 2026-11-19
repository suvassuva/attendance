import { Attendance, AttendanceFiltersState, AttendanceStats } from '@/types/attendance';

/**
 * Normalizes an employee name for comparison: trimmed, lowercase, collapsed spaces.
 */
export function normalizeEmployeeName(name: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Generates a deterministic Firestore document ID based on employee identity and date.
 * Guarantees duplicate prevention directly at the database layer.
 */
export function generateDeterministicDocId(name: string, date: string, employeeId?: string): string {
  const cleanDate = date.trim();
  if (employeeId && employeeId.trim()) {
    const cleanEmpId = employeeId.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `att_${cleanEmpId}_${cleanDate}`;
  }
  const normName = normalizeEmployeeName(name).replace(/[^a-z0-9]/g, '_');
  return `att_${normName}_${cleanDate}`;
}

/**
 * Generates a unique deduplication key for an attendance entry.
 */
export function getAttendanceKey(name: string, date: string, employeeId?: string): string {
  if (employeeId && employeeId.trim()) {
    return `${employeeId.trim().toLowerCase()}_${date.trim()}`;
  }
  return `${normalizeEmployeeName(name)}_${date.trim()}`;
}

/**
 * Checks if a record would produce a duplicate entry on the same date for the same employee.
 */
export function checkDuplicateAttendance(
  records: Attendance[],
  candidate: { name: string; date: string; employeeId?: string; id?: string }
): { isDuplicate: boolean; message?: string } {
  const normName = normalizeEmployeeName(candidate.name);
  const normEmpId = candidate.employeeId ? candidate.employeeId.trim().toLowerCase() : undefined;
  const targetDate = candidate.date.trim();

  const existing = records.find((rec) => {
    // Skip self when updating
    if (candidate.id && rec.id === candidate.id) {
      return false;
    }

    // Must be on the same date
    if (rec.date.trim() !== targetDate) {
      return false;
    }

    // Match by employeeId if both provide it
    if (normEmpId && rec.employeeId && rec.employeeId.trim().toLowerCase() === normEmpId) {
      return true;
    }

    // Match by normalized employee name
    const recName = rec.name || rec.employeeName || '';
    return normalizeEmployeeName(recName) === normName;
  });

  if (existing) {
    return {
      isDuplicate: true,
      message: `An attendance entry for "${candidate.name}" on ${candidate.date} already exists (ID: ${existing.id}).`,
    };
  }

  return { isDuplicate: false };
}

/**
 * Validates whether a time string strictly matches the 24-hour HH:mm format (00:00 - 23:59).
 */
export function isValidHHmm(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false;
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeStr.trim());
}

/**
 * Parses either HH:mm (24-hour) or hh:mm a (12-hour AM/PM) into minutes from midnight.
 * Returns null if the format is invalid or represents an empty/absent string.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || timeStr === '--:--' || timeStr === '') return null;

  const trimmed = timeStr.trim();

  // Try 24-hour HH:mm
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }

  // Try 12-hour hh:mm AM/PM
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3]?.toUpperCase();

    if (minutes < 0 || minutes > 59) return null;

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    if (hours >= 0 && hours <= 23) {
      return hours * 60 + minutes;
    }
  }

  return null;
}

/**
 * Normalizes any valid time input into standard 24-hour HH:mm format.
 * If absent or empty, returns "--:--".
 */
export function formatToHHmm(timeStr: string): string {
  if (!timeStr || timeStr === '--:--') return '--:--';

  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;

  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Converts a 24-hour HH:mm time to a user-friendly 12-hour AM/PM string.
 */
export function formatToDisplayTime(timeStr: string): string {
  if (!timeStr || timeStr === '--:--' || timeStr === '') return '--:--';

  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;

  let hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Compares two times. Returns negative if t1 < t2, 0 if equal, positive if t1 > t2.
 * Returns null if either time cannot be parsed.
 */
export function compareTimes(t1: string, t2: string): number | null {
  const m1 = parseTimeToMinutes(t1);
  const m2 = parseTimeToMinutes(t2);
  if (m1 === null || m2 === null) return null;
  return m1 - m2;
}

/**
 * Filters attendance records by search term, department, status, and date.
 */
export function filterAttendanceRecords(
  records: Attendance[],
  filters: AttendanceFiltersState
): Attendance[] {
  return records.filter((record) => {
    // 1. Search Query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const recName = (record.name || record.employeeName || '').toLowerCase();
      const recId = (record.employeeId || '').toLowerCase();
      const recEmail = (record.email || '').toLowerCase();
      const recDept = (record.department || '').toLowerCase();

      const matched =
        recName.includes(q) || recId.includes(q) || recEmail.includes(q) || recDept.includes(q);
      if (!matched) return false;
    }

    // 2. Department filter
    if (filters.department && record.department !== filters.department) {
      return false;
    }

    // 3. Status filter
    if (filters.status && record.status !== filters.status) {
      return false;
    }

    // 4. Date filter
    if (filters.date && record.date !== filters.date) {
      return false;
    }

    return true;
  });
}

/**
 * Searches records across employee name, ID, and department.
 */
export function searchAttendance(records: Attendance[], query: string): Attendance[] {
  if (!query || !query.trim()) return records;
  const q = query.toLowerCase().trim();

  return records.filter((r) => {
    const name = (r.name || r.employeeName || '').toLowerCase();
    const id = (r.employeeId || '').toLowerCase();
    const dept = (r.department || '').toLowerCase();
    return name.includes(q) || id.includes(q) || dept.includes(q);
  });
}

/**
 * Calculates dynamic KPI metrics based on the provided records and date context.
 */
export function calculateAttendanceStats(
  allRecords: Attendance[],
  targetDate?: string
): AttendanceStats {
  const dateToUse = targetDate || '2026-11-19';

  // Context records for the specified date
  const contextRecords = targetDate
    ? allRecords.filter((r) => r.date === targetDate)
    : allRecords;

  const totalInContext = contextRecords.length;
  const presentCount = contextRecords.filter((r) => r.status === 'Present').length;
  const lateCount = contextRecords.filter((r) => r.status === 'Late').length;
  const absentCount = contextRecords.filter((r) => r.status === 'Absent').length;
  const halfDayCount = contextRecords.filter((r) => r.status === 'Half-Day').length;

  // Unique employee count across all known records
  const uniqueEmployees = new Set(
    allRecords.map((r) => r.employeeId || r.name || r.employeeName)
  );
  const totalEmployeesCount = uniqueEmployees.size;

  const presentRate =
    totalInContext > 0
      ? Math.round(((presentCount + halfDayCount) / totalInContext) * 100)
      : 0;

  const lateRate =
    totalInContext > 0 ? Math.round((lateCount / totalInContext) * 100) : 0;

  const absentRate =
    totalInContext > 0 ? Math.round((absentCount / totalInContext) * 100) : 0;

  return {
    totalEmployees: totalEmployeesCount,
    presentToday: presentCount,
    lateToday: lateCount,
    absentToday: absentCount,
    halfDayToday: halfDayCount,
    presentRate,
    lateRate,
    absentRate,
    targetDate: dateToUse,
    totalRecordsInContext: totalInContext,
  };
}

