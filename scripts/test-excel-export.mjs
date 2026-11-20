import * as XLSX from 'xlsx';
import fs from 'fs';

// Read dummy data to test
const dummyModule = await import('../lib/dummy-data.ts');
const rawRecords = dummyModule.DUMMY_ATTENDANCE;

console.log('Total raw records:', rawRecords.length);

// Deduplicate
const uniqueMap = new Map();
rawRecords.forEach((rec) => {
  const key = `${(rec.name || rec.employeeName || '').toLowerCase().trim()}_${(rec.branch || '').toLowerCase().trim()}_${rec.date || ''}`;
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, rec);
  }
});
const cleanRecords = Array.from(uniqueMap.values());
console.log('Total unique records:', cleanRecords.length);

const presentRecords = cleanRecords.filter((r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Half-Day');
const absentRecords = cleanRecords.filter((r) => r.status === 'Absent');
const relieverRecords = cleanRecords.filter(
  (r) =>
    r.isReliever ||
    Boolean(r.relieverName) ||
    r.notes?.toLowerCase().includes('reliever') ||
    r.notes?.toLowerCase().includes('covering') ||
    r.notes?.toLowerCase().includes('movement')
);

console.log('Present records count:', presentRecords.length);
console.log('Absent records count:', absentRecords.length);
console.log('Reliever records count:', relieverRecords.length);

// Create workbook
const workbook = XLSX.utils.book_new();

// Tab 1: Summary Overview
const summaryData = [
  { Metric: 'Report Date', Value: '2026-11-20', Details: 'Attendance Date Filter' },
  { Metric: 'Total Staff Tracked', Value: cleanRecords.length, Details: 'BM & ABM combined' },
  { Metric: 'Present on Duty', Value: presentRecords.length, Details: '83% on-duty rate' },
  { Metric: 'Absent / On Leave', Value: absentRecords.length, Details: '17% leave rate' },
  { Metric: 'Relievers & Movements', Value: relieverRecords.length, Details: 'Active reliever assignments' },
];
const summarySheet = XLSX.utils.json_to_sheet(summaryData);
XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Overview');

// Tab 2: Present Staff
const presentSheet = XLSX.utils.json_to_sheet(presentRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Branch': r.branch,
  'Employee Name': r.name,
  'Role': r.role === 'ABM' || r.department === 'ABM' ? 'ABM' : 'BM',
  'Status': r.status,
  'Check In': r.checkIn,
  'Check Out': r.checkOut,
  'Duty Type': r.isReliever ? 'Reliever Stationed' : 'Regular Branch Staff',
  'Remarks': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, presentSheet, 'Present Staff');

// Tab 3: Absent Staff
const absentSheet = XLSX.utils.json_to_sheet(absentRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Branch': r.branch,
  'Absent Employee Name': r.name,
  'Role': r.role === 'ABM' || r.department === 'ABM' ? 'ABM' : 'BM',
  'Status': 'Absent',
  'Reliever Coverage Status': r.relieverName ? `Covered by: ${r.relieverName}` : 'Vacant / No Reliever Assigned',
  'Remarks / Reason': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, absentSheet, 'Absent Staff');

// Tab 4: Relievers & Deputations
const relieverSheet = XLSX.utils.json_to_sheet(relieverRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Stationed Branch': r.branch,
  'Reliever / Person': r.name || r.relieverName,
  'Role': r.role === 'ABM' || r.department === 'ABM' ? 'ABM' : 'BM',
  'Operation Type': r.isReliever ? 'Reliever Deployed on Duty' : (r.relieverName ? 'Absent Staff Covered by Reliever' : 'Inter-Branch Movement'),
  'Covering For': r.coveringFor || (r.status === 'Absent' ? r.name : 'Movement'),
  'Origin Branch': r.relieverFromBranch || 'N/A',
  'Shift Timings': `${r.checkIn} - ${r.checkOut}`,
  'Details & Notes': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, relieverSheet, 'Relievers & Deputations');

// Tab 5: Master Roster
const masterSheet = XLSX.utils.json_to_sheet(cleanRecords.map((r, i) => ({
  'Sl. No': i + 1,
  'Branch': r.branch,
  'Employee Name': r.name,
  'Role': r.role === 'ABM' || r.department === 'ABM' ? 'ABM' : 'BM',
  'Date': r.date,
  'Status': r.status,
  'Remarks': r.notes,
})));
XLSX.utils.book_append_sheet(workbook, masterSheet, 'Master Roster (All)');

XLSX.writeFile(workbook, 'test-output.xlsx');
console.log('Workbook created successfully! Sheet names:', workbook.SheetNames);

