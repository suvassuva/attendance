const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lib/data/bangalore-data.json', 'utf8'));

const tsContent = `import { Attendance, Department, Branch } from '@/types/attendance';

export const DEPARTMENTS: Department[] = [
  'BM',
  'ABM',
];

export const BRANCHES: Branch[] = ${JSON.stringify(data.branches.map(b => b.name), null, 2)};

export interface BranchInfo {
  name: string;
  status: 'Active' | 'Closed' | 'Permanent Closed';
}

export const BANGALORE_BRANCH_DETAILS: BranchInfo[] = ${JSON.stringify(data.branches, null, 2)};

export interface StaffMovement {
  name: string;
  phone: string;
  from: string;
  to: string;
  date: string;
}

export const STAFF_MOVEMENTS: StaffMovement[] = ${JSON.stringify(data.movements, null, 2)};

export const INITIAL_ATTENDANCE_DATA: Attendance[] = ${JSON.stringify(data.attendanceRecords, null, 2)};
`;

fs.writeFileSync('lib/dummy-data.ts', tsContent);
console.log('Successfully wrote updated lib/dummy-data.ts');

