export type AttendanceStatus = 'Present' | 'Late' | 'Half-Day' | 'Absent';

export type Department =
  | 'Engineering'
  | 'Design'
  | 'Product'
  | 'Marketing'
  | 'Human Resources'
  | 'Sales'
  | 'Finance'
  | 'Operations';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  avatarUrl?: string;
  department: Department;
  date: string; // YYYY-MM-DD
  checkIn: string; // e.g. "09:00 AM" or "--:--"
  checkOut: string; // e.g. "05:30 PM" or "--:--"
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceFiltersState {
  searchQuery: string;
  department: string;
  status: string;
  date: string;
}

export interface AttendanceFormData {
  employeeName: string;
  department: Department;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface KPICardData {
  title: string;
  value: number;
  label: string;
  description: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color: 'blue' | 'green' | 'amber' | 'red';
}

