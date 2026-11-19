export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Half-Day'
  | 'Absent';

export type Department =
  | 'Engineering'
  | 'Design'
  | 'Product'
  | 'Marketing'
  | 'Human Resources'
  | 'Sales'
  | 'Finance'
  | 'Operations'
  | (string & {});

export interface Attendance {
  id: string;
  name: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:mm format (or empty string/--:-- for Absent)
  checkOut: string; // HH:mm format (or empty string/--:-- for Absent)
  status: AttendanceStatus;
  createdAt?: unknown;
  employeeId?: string;
  email?: string;
  notes?: string;
  avatarUrl?: string;
  // UI backward-compatibility alias
  employeeName?: string;
}

// Backward-compatibility alias
export type AttendanceRecord = Attendance;

export interface AttendanceFiltersState {
  searchQuery: string;
  department: string;
  status: string;
  date: string;
}

export interface AttendanceFormData {
  name: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  notes?: string;
  employeeId?: string;
  // UI alias
  employeeName?: string;
}

export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  halfDayToday: number;
  presentRate: number;
  lateRate: number;
  absentRate: number;
  targetDate: string;
  totalRecordsInContext: number;
}

export interface ValidationErrors {
  name?: string;
  department?: string;
  date?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  general?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export type CreateAttendanceDTO = Omit<Attendance, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: unknown;
};

export type UpdateAttendanceDTO = Partial<Omit<Attendance, 'id' | 'createdAt'>>;
