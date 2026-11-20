export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Half-Day'
  | 'Absent';

export type Department =
  | 'BM'
  | 'ABM'
  | 'Branch Manager'
  | 'Assistant Branch Manager'
  | (string & {});

export type Branch =
  | 'Bannerghatta'
  | 'Basaveshwara Nagar'
  | 'Basaveshwara Nagar 2'
  | 'Bommanahalli'
  | 'Fraser Town'
  | 'Gandhi Bazar'
  | 'Ganganagar (CBI)'
  | 'Hosa road'
  | 'Hoskote'
  | 'Hongasandra'
  | 'Indiranagar'
  | 'J P Nagar'
  | 'Jakkur'
  | 'Jayanagar'
  | 'Kathriguppe'
  | 'Kengeri'
  | 'K R Puram'
  | 'K R Puram - 2'
  | 'Kadugudi'
  | 'Kodagehalli'
  | 'Koramangala'
  | 'Kothanur'
  | 'Lingarajapuram'
  | 'Mahalakshmi layout'
  | 'Marathalli'
  | 'Malleshwaram'
  | 'Nelmangala'
  | 'Nagarabhavi'
  | 'Peenya-Jallahalli'
  | 'Peenya-Jalahalli - 2'
  | 'Peenya-Hegnahalli'
  | 'Queens Road'
  | 'Rajajinagar'
  | 'Ramamurthy Nagar'
  | 'Sevanagar'
  | 'Sunkadakatte'
  | 'Sunkadakatte 2'
  | 'Sarjapur'
  | 'Thanisandra'
  | 'Tin Factory'
  | 'Uttarahalli'
  | 'Vidyaranyapura'
  | 'Vijayanagar'
  | 'Vignan Nagar'
  | 'Varthur'
  | 'Whitefield'
  | 'Whitefield - 2'
  | 'Yelahanka'
  | 'Yeshwanthpur'
  | 'Yeshwanthpur 2'
  | 'Ulsoor'
  | '8th Mile'
  | 'Malleshwarm - 2'
  | 'Madiwala'
  | (string & {});

export interface Attendance {
  id: string;
  name: string;
  department: string;
  branch?: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:mm format (or empty string/--:-- for Absent)
  checkOut: string; // HH:mm format (or empty string/--:-- for Absent)
  status: AttendanceStatus;
  createdAt?: unknown;
  employeeId?: string;
  email?: string;
  role?: string;
  notes?: string;
  avatarUrl?: string;
  // Reliever / Replacement fields
  isReliever?: boolean;
  coveringFor?: string;
  relieverName?: string;
  relieverPhone?: string;
  relieverFromBranch?: string;
  // UI backward-compatibility alias
  employeeName?: string;
}

// Reliever / Replacement payload interface
export interface RelieverDetails {
  relieverName: string;
  relieverPhone?: string;
  fromBranch: string;
  toBranch: string;
  date: string;
  role?: string;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

// Backward-compatibility alias
export type AttendanceRecord = Attendance;

export interface AttendanceFiltersState {
  searchQuery: string;
  department: string;
  branch: string;
  status: string;
  date: string;
}

export interface AttendanceFormData {
  name: string;
  department: string;
  branch: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  notes?: string;
  employeeId?: string;
  role?: string;
  isReliever?: boolean;
  coveringFor?: string;
  relieverName?: string;
  relieverPhone?: string;
  relieverFromBranch?: string;
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
  branch?: string;
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
