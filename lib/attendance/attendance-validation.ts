import { Attendance, AttendanceStatus, ValidationResult, ValidationErrors } from '@/types/attendance';
import { parseTimeToMinutes } from './attendance-utils';

export const VALID_STATUSES: readonly AttendanceStatus[] = [
  'Present',
  'Late',
  'Half-Day',
  'Absent',
] as const;

export class AttendanceValidationError extends Error {
  public errors: ValidationErrors;

  constructor(message: string, errors: ValidationErrors = {}) {
    super(message);
    this.name = 'AttendanceValidationError';
    this.errors = errors;
  }
}

/**
 * Validates attendance record payload according to Phase 2 business rules.
 */
export function validateAttendance(data: Partial<Attendance>): ValidationResult {
  const errors: ValidationErrors = {};

  // 1. Employee Name
  const name = (data.name ?? data.employeeName ?? '').trim();
  if (!name) {
    errors.name = 'Employee name is required.';
  } else if (name.length < 2) {
    errors.name = 'Employee name must be at least 2 characters.';
  }

  // 2. Department
  const department = (data.department ?? '').trim();
  if (!department) {
    errors.department = 'Department is required.';
  }

  // 3. Date
  const date = (data.date ?? '').trim();
  if (!date) {
    errors.date = 'Date is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = 'Date must follow YYYY-MM-DD format.';
  } else {
    const timestamp = Date.parse(date);
    if (isNaN(timestamp)) {
      errors.date = 'Date must be a valid calendar date.';
    }
  }

  // 4. Status
  const status = data.status;
  if (!status) {
    errors.status = 'Attendance status is required.';
  } else if (!VALID_STATUSES.includes(status as AttendanceStatus)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}.`;
  }

  // 5, 6, 7. Check-in and Check-out Validation
  const isAbsent = status === 'Absent';
  const checkIn = (data.checkIn ?? '').trim();
  const checkOut = (data.checkOut ?? '').trim();

  if (!isAbsent) {
    // Non-absent records require a valid check-in time
    if (!checkIn || checkIn === '--:--') {
      errors.checkIn = 'Check-in time is required for active attendance.';
    } else {
      const checkInMinutes = parseTimeToMinutes(checkIn);
      if (checkInMinutes === null) {
        errors.checkIn = 'Check-in time must be a valid time in HH:mm format.';
      }
    }

    // Check-out time is optional (e.g. employee is currently checked in/in-progress),
    // but if provided and not empty/--:--, it must be valid and >= check-in
    if (checkOut && checkOut !== '--:--') {
      const checkOutMinutes = parseTimeToMinutes(checkOut);
      if (checkOutMinutes === null) {
        errors.checkOut = 'Check-out time must be a valid time in HH:mm format.';
      } else {
        const checkInMinutes = parseTimeToMinutes(checkIn);
        if (checkInMinutes !== null && checkOutMinutes < checkInMinutes) {
          errors.checkOut = 'Check-out time cannot be earlier than check-in time.';
        }
      }
    }
  } else {
    // For Absent employees: check-in/out times are not required.
    // If times are provided, they must either be empty/--:-- or valid HH:mm
    if (checkIn && checkIn !== '--:--' && parseTimeToMinutes(checkIn) === null) {
      errors.checkIn = 'Check-in time must use HH:mm format or be left empty for absent status.';
    }
    if (checkOut && checkOut !== '--:--' && parseTimeToMinutes(checkOut) === null) {
      errors.checkOut = 'Check-out time must use HH:mm format or be left empty for absent status.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates attendance and throws an AttendanceValidationError if validation fails.
 */
export function validateAttendanceOrThrow(data: Partial<Attendance>): void {
  const result = validateAttendance(data);
  if (!result.isValid) {
    const firstErrorMessage =
      Object.values(result.errors)[0] || 'Attendance validation failed.';
    throw new AttendanceValidationError(firstErrorMessage, result.errors);
  }
}
