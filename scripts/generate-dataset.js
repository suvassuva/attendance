const fs = require('fs');

const raw = fs.readFileSync('data/bangalore_attendance_2026-11-20.csv', 'utf8');
const lines = raw.trim().split(/\r?\n/);

const BANGALORE_BRANCHES = [];
const ATTENDANCE_RECORDS = [];
let empCounter = 1001;

// Reliever / Movement lookup
const movements = [
  { name: 'Sikindar', phone: '9901502503', from: 'Basaveshwara Nagar', to: 'Basaveshwara Nagar', date: '2026-11-16' },
  { name: 'Suryakanth', phone: '9353066832', from: 'Koramangala', to: 'Whitefield', date: '2026-11-16' },
  { name: 'Sunil', phone: '8073203729', from: 'Kengeri', to: 'R R Nagar', date: '2026-11-16' },
  { name: 'Ramachandra', phone: '8088244326', from: 'Jalahalli', to: 'Hegganahalli', date: '2026-11-16' },
  { name: 'Punith', phone: '9538380402', from: 'Hoskerehalli', to: 'J P Nagar', date: '2026-11-16' },
  { name: 'James', phone: '9066551828', from: 'Marathahalli', to: 'Varthur', date: '2026-11-16' },
];

// Absent employees (10 leaves from report)
const leaves = [
  { name: 'Priyanka', branch: 'Queens Road', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Pavithra R', branch: 'Kengeri', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Ningamma', branch: 'Marathalli', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Swathi', branch: 'Yeshwanthpur 2', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Bhagyalakshmi', branch: 'Hongasandra', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Yeshaswini', branch: 'Peenya-Jallahalli', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Tejas', branch: 'Indiranagar', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Santhosh Kumar R', branch: 'Basaveshwara Nagar', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Sunitha', branch: 'Kodagehalli', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent' },
  { name: 'Livingstan', branch: 'Yelahanka', role: 'Branch Manager', status: 'Absent', notes: 'Reported Leave / Absent (Ref: 11700)' },
];

lines.slice(1).forEach((line) => {
  const parts = line.split(',');
  const branchName = parts[1]?.trim();
  const bm = parts[2]?.trim();
  const abm = parts[3]?.trim();

  if (!branchName) return;

  const isClosed = bm?.toLowerCase().includes('close') || abm?.toLowerCase().includes('close');
  const isPermanent = bm?.toLowerCase().includes('permanent');

  BANGALORE_BRANCHES.push({
    name: branchName,
    status: isClosed ? (isPermanent ? 'Permanent Closed' : 'Closed') : 'Active',
  });

  if (!isClosed) {
    if (bm && !bm.toLowerCase().includes('close')) {
      const rel = movements.find(m => m.name.toLowerCase() === bm.toLowerCase());
      ATTENDANCE_RECORDS.push({
        id: `att-bg-${empCounter}`,
        employeeId: `EMP-${empCounter}`,
        name: bm,
        employeeName: bm,
        email: `${bm.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`,
        department: 'BM',
        role: 'Branch Manager',
        branch: branchName,
        date: '2026-11-20',
        checkIn: '09:30',
        checkOut: '18:30',
        status: 'Present',
        notes: rel ? `Movement: ${rel.from} -> ${rel.to} (${rel.phone})` : 'On-Duty regular hours',
        createdAt: '2026-11-20T04:00:00.000Z',
      });
      empCounter++;
    }

    if (abm && !abm.toLowerCase().includes('close')) {
      ATTENDANCE_RECORDS.push({
        id: `att-bg-${empCounter}`,
        employeeId: `EMP-${empCounter}`,
        name: abm,
        employeeName: abm,
        email: `${abm.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`,
        department: 'ABM',
        role: 'Assistant Branch Manager',
        branch: branchName,
        date: '2026-11-20',
        checkIn: '09:45',
        checkOut: '18:30',
        status: 'Present',
        notes: 'On-Duty regular hours',
        createdAt: '2026-11-20T04:15:00.000Z',
      });
      empCounter++;
    }
  }
});

// Add the 10 Leave / Absent records
leaves.forEach((l) => {
  ATTENDANCE_RECORDS.push({
    id: `att-bg-${empCounter}`,
    employeeId: `EMP-${empCounter}`,
    name: l.name,
    employeeName: l.name,
    email: `${l.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`,
    department: 'BM',
    role: l.role,
    branch: l.branch,
    date: '2026-11-20',
    checkIn: '--:--',
    checkOut: '--:--',
    status: 'Absent',
    notes: l.notes,
    createdAt: '2026-11-20T03:30:00.000Z',
  });
  empCounter++;
});

console.log('Total Branches:', BANGALORE_BRANCHES.length);
console.log('Total Attendance Records (52 Present + 10 Absent):', ATTENDANCE_RECORDS.length);

fs.mkdirSync('lib/data', { recursive: true });
fs.writeFileSync('lib/data/bangalore-data.json', JSON.stringify({
  branches: BANGALORE_BRANCHES,
  attendanceRecords: ATTENDANCE_RECORDS,
  movements,
}, null, 2));

console.log('Generated lib/data/bangalore-data.json successfully!');
