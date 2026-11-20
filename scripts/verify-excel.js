const XLSX = require('xlsx');

// Mock data resembling the 64 records
const sampleRecords = [
  { branch: 'Bannerghatta', name: 'Meghana', role: 'BM', status: 'Present', checkIn: '09:30', checkOut: '18:30', notes: 'On-Duty regular hours' },
  { branch: 'Fraser Town', name: 'Aishwarya R', role: 'ABM', status: 'Present', checkIn: '09:45', checkOut: '18:30', notes: 'On-Duty regular hours' },
  { branch: 'Marathalli', name: 'Ningamma', role: 'BM', status: 'Absent', checkIn: '', checkOut: '', notes: 'Reported Leave / Absent' },
  { branch: 'Rajajinagar', name: 'vasu', role: 'BM', status: 'Absent', checkIn: '', checkOut: '', relieverName: 'ramesh', relieverFromBranch: 'Basaveshwara Nagar', notes: 'Covered by Reliever Ramesh' },
  { branch: 'Rajajinagar', name: 'ramesh', role: 'BM', status: 'Present', checkIn: '09:30', checkOut: '18:30', isReliever: true, coveringFor: 'vasu', relieverFromBranch: 'Basaveshwara Nagar', notes: 'Reliever assigned covering for vasu' },
  { branch: 'Kodagehalli', name: 'Sikindar', role: 'BM', status: 'Present', checkIn: '09:30', checkOut: '18:30', notes: 'Movement: Basaveshwara Nagar -> Basaveshwara Nagar' },
];

const workbook = XLSX.utils.book_new();

// Tab 1: Summary Overview
const summaryData = [
  { Metric: 'Report Date', Value: '2026-11-20', Details: 'Attendance Date Filter' },
  { Metric: 'Total Staff Tracked', Value: sampleRecords.length, Details: 'BM & ABM combined' },
  { Metric: 'Present on Duty', Value: 4, Details: '67% on-duty rate' },
  { Metric: 'Absent / On Leave', Value: 2, Details: '33% leave rate' },
  { Metric: 'Reliever & Movement Operations', Value: 3, Details: 'Active relievers and branch deputations' },
];
const summarySheet = XLSX.utils.json_to_sheet(summaryData);
XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Overview');

// Tab 2: Present Staff
const presentRecords = sampleRecords.filter(r => r.status === 'Present');
const presentSheet = XLSX.utils.json_to_sheet(presentRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Branch': r.branch,
  'Employee Name': r.name,
  'Role': r.role,
  'Status': r.status,
  'Check In': r.checkIn,
  'Check Out': r.checkOut,
  'Duty Type': r.isReliever ? 'Reliever Stationed' : 'Regular Branch Staff',
  'Remarks': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, presentSheet, 'Present Staff');

// Tab 3: Absent Staff
const absentRecords = sampleRecords.filter(r => r.status === 'Absent');
const absentSheet = XLSX.utils.json_to_sheet(absentRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Branch': r.branch,
  'Absent Employee Name': r.name,
  'Role': r.role,
  'Status': r.status,
  'Reliever Coverage Status': r.relieverName ? `Covered by: ${r.relieverName} (From: ${r.relieverFromBranch})` : 'Vacant / No Reliever Assigned',
  'Remarks / Reason': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, absentSheet, 'Absent Staff');

// Tab 4: Relievers & Deputations
const relieverRecords = sampleRecords.filter(r => r.isReliever || r.relieverName || (r.notes && r.notes.includes('Movement')));
const relieverSheet = XLSX.utils.json_to_sheet(relieverRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Stationed Branch': r.branch,
  'Reliever / Person': r.isReliever ? r.name : (r.relieverName || r.name),
  'Role': r.role,
  'Operation Type': r.isReliever ? 'Reliever Deployed on Duty' : (r.relieverName ? 'Absent Staff Covered by Reliever' : 'Inter-Branch Movement'),
  'Covering For': r.coveringFor || (r.status === 'Absent' ? r.name : 'Branch Movement'),
  'Origin Branch': r.relieverFromBranch || 'N/A',
  'Shift Timings': `${r.checkIn} - ${r.checkOut}`,
  'Details & Notes': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, relieverSheet, 'Relievers & Deputations');

// Tab 5: Master Roster
const allSheet = XLSX.utils.json_to_sheet(sampleRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Branch': r.branch,
  'Employee Name': r.name,
  'Role': r.role,
  'Date': '2026-11-20',
  'Status': r.status,
  'Remarks': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, allSheet, 'Master Roster (All)');

XLSX.writeFile(workbook, 'scripts/output-sample.xlsx');

const readBack = XLSX.readFile('scripts/output-sample.xlsx');
console.log('SUCCESS! Workbook Tabs verified:');
readBack.SheetNames.forEach((sheetName) => {
  const data = XLSX.utils.sheet_to_json(readBack.Sheets[sheetName]);
  console.log(` - Tab "${sheetName}": ${data.length} rows`);
});

