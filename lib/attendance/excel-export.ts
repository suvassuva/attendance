import * as XLSX from 'xlsx';
import { Attendance } from '@/types/attendance';
import { formatToDisplayTime } from './attendance-utils';

/**
 * Helper to get clean role string ('BM' or 'ABM')
 */
function getRoleLabel(rec: Attendance): 'BM' | 'ABM' {
  const isABM =
    rec.role === 'Assistant Branch Manager' ||
    rec.role === 'ABM' ||
    rec.department === 'ABM';
  return isABM ? 'ABM' : 'BM';
}

/**
 * Exports attendance records to a beautifully organized, multi-tab Excel (.xlsx) file.
 * Separates Present, Absent, and Reliever / Deputation records into dedicated worksheets.
 */
export function exportAttendanceToExcel(
  records: Attendance[],
  dateFilter?: string
) {
  if (!records || records.length === 0) {
    return false;
  }

  const reportDate = dateFilter || new Date().toISOString().split('T')[0];
  const workbook = XLSX.utils.book_new();

  // Deduplicate records by unique key (name + branch + date)
  const uniqueMap = new Map<string, Attendance>();
  records.forEach((rec) => {
    const key = `${(rec.name || rec.employeeName || '').toLowerCase().trim()}_${(rec.branch || '').toLowerCase().trim()}_${rec.date || ''}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, rec);
    }
  });
  const cleanRecords = Array.from(uniqueMap.values());

  // 1. Separate into categorised datasets
  const presentRecords = cleanRecords
    .filter((r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Half-Day')
    .sort((a, b) => (a.branch || '').localeCompare(b.branch || ''));

  const absentRecords = cleanRecords
    .filter((r) => r.status === 'Absent')
    .sort((a, b) => (a.branch || '').localeCompare(b.branch || ''));

  const relieverRecords = cleanRecords
    .filter(
      (r) =>
        r.isReliever ||
        Boolean(r.relieverName) ||
        r.notes?.toLowerCase().includes('reliever') ||
        r.notes?.toLowerCase().includes('covering') ||
        r.notes?.toLowerCase().includes('movement')
    )
    .sort((a, b) => (a.branch || '').localeCompare(b.branch || ''));

  // -------------------------------------------------------------
  // TAB 1: Summary Overview
  // -------------------------------------------------------------
  const totalEmployees = cleanRecords.length;
  const presentCount = presentRecords.length;
  const absentCount = absentRecords.length;
  const relieverCount = relieverRecords.length;
  const uniqueBranches = new Set(cleanRecords.map((r) => r.branch).filter(Boolean)).size;

  const summaryData = [
    { Metric: 'Report Date', Value: reportDate, Details: 'Attendance Date Filter' },
    { Metric: 'Total Staff Tracked', Value: totalEmployees, Details: 'BM & ABM combined' },
    { Metric: 'Branches Monitored', Value: uniqueBranches, Details: 'Bangalore branches' },
    {
      Metric: 'Present on Duty',
      Value: presentCount,
      Details: `${Math.round((presentCount / Math.max(totalEmployees, 1)) * 100)}% on-duty rate`,
    },
    {
      Metric: 'Absent / On Leave',
      Value: absentCount,
      Details: `${Math.round((absentCount / Math.max(totalEmployees, 1)) * 100)}% leave rate`,
    },
    {
      Metric: 'Reliever & Movement Operations',
      Value: relieverCount,
      Details: 'Active relievers and branch deputations',
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 42 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Overview');

  // -------------------------------------------------------------
  // TAB 2: Present Staff (On Duty)
  // -------------------------------------------------------------
  const presentExportData =
    presentRecords.length > 0
      ? presentRecords.map((rec, index) => ({
          'Sl. No': index + 1,
          'Branch': rec.branch || 'N/A',
          'Employee Name': rec.name || rec.employeeName || 'Unknown',
          'Role': getRoleLabel(rec),
          'Status': rec.status || 'Present',
          'Check In': formatToDisplayTime(rec.checkIn),
          'Check Out': formatToDisplayTime(rec.checkOut),
          'Duty Type': rec.isReliever ? 'Reliever Stationed' : 'Regular Branch Staff',
          'Remarks': rec.notes || 'On-Duty regular hours',
        }))
      : [
          {
            'Sl. No': 1,
            'Branch': 'N/A',
            'Employee Name': 'No present records found',
            'Role': 'N/A',
            'Status': 'N/A',
            'Check In': '--:--',
            'Check Out': '--:--',
            'Duty Type': 'N/A',
            'Remarks': 'N/A',
          },
        ];

  const presentSheet = XLSX.utils.json_to_sheet(presentExportData);
  presentSheet['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 22 }, // Branch
    { wch: 24 }, // Employee Name
    { wch: 10 }, // Role
    { wch: 12 }, // Status
    { wch: 12 }, // Check In
    { wch: 12 }, // Check Out
    { wch: 22 }, // Duty Type
    { wch: 36 }, // Remarks
  ];
  XLSX.utils.book_append_sheet(workbook, presentSheet, 'Present Staff');

  // -------------------------------------------------------------
  // TAB 3: Absent Staff (Leaves & Reliever Coverage)
  // -------------------------------------------------------------
  const absentExportData =
    absentRecords.length > 0
      ? absentRecords.map((rec, index) => {
          let coverageStatus = 'Vacant / No Reliever Assigned';
          if (rec.relieverName) {
            coverageStatus = `Covered by: ${rec.relieverName}`;
            if (rec.relieverFromBranch) {
              coverageStatus += ` (From: ${rec.relieverFromBranch})`;
            }
          }

          return {
            'Sl. No': index + 1,
            'Branch': rec.branch || 'N/A',
            'Absent Employee Name': rec.name || rec.employeeName || 'Unknown',
            'Role': getRoleLabel(rec),
            'Status': 'Absent',
            'Reliever Coverage Status': coverageStatus,
            'Remarks / Reason': rec.notes || 'Reported Leave / Absent',
          };
        })
      : [
          {
            'Sl. No': 1,
            'Branch': 'N/A',
            'Absent Employee Name': 'No absent records found',
            'Role': 'N/A',
            'Status': 'N/A',
            'Reliever Coverage Status': 'N/A',
            'Remarks / Reason': 'N/A',
          },
        ];

  const absentSheet = XLSX.utils.json_to_sheet(absentExportData);
  absentSheet['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 22 }, // Branch
    { wch: 24 }, // Absent Employee Name
    { wch: 10 }, // Role
    { wch: 12 }, // Status
    { wch: 42 }, // Reliever Coverage Status
    { wch: 36 }, // Remarks / Reason
  ];
  XLSX.utils.book_append_sheet(workbook, absentSheet, 'Absent Staff');

  // -------------------------------------------------------------
  // TAB 4: Relievers & Deputations
  // -------------------------------------------------------------
  const relieverExportData =
    relieverRecords.length > 0
      ? relieverRecords.map((rec, index) => {
          let relName = rec.isReliever
            ? rec.name || rec.employeeName
            : rec.relieverName || rec.name;

          let covFor = rec.coveringFor || '';
          if (!covFor && rec.status === 'Absent') {
            covFor = rec.name || rec.employeeName || 'Absent Staff';
          } else if (!covFor) {
            covFor = 'Branch Movement';
          }

          let originBranch = rec.relieverFromBranch || 'N/A';
          let operationType = rec.isReliever
            ? 'Reliever Deployed on Duty'
            : rec.relieverName
            ? 'Absent Staff Covered by Reliever'
            : 'Inter-Branch Movement';

          return {
            'Sl. No': index + 1,
            'Stationed Branch': rec.branch || 'N/A',
            'Reliever / Person': relName || 'Unknown',
            'Role': getRoleLabel(rec),
            'Operation Type': operationType,
            'Covering For': covFor,
            'Origin Branch': originBranch,
            'Shift Timings': `${formatToDisplayTime(rec.checkIn)} - ${formatToDisplayTime(rec.checkOut)}`,
            'Details & Notes': rec.notes || '',
          };
        })
      : [
          {
            'Sl. No': 1,
            'Stationed Branch': 'N/A',
            'Reliever / Person': 'No reliever assignments recorded',
            'Role': 'N/A',
            'Operation Type': 'N/A',
            'Covering For': 'N/A',
            'Origin Branch': 'N/A',
            'Shift Timings': 'N/A',
            'Details & Notes': 'N/A',
          },
        ];

  const relieverSheet = XLSX.utils.json_to_sheet(relieverExportData);
  relieverSheet['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 22 }, // Stationed Branch
    { wch: 24 }, // Reliever / Person
    { wch: 10 }, // Role
    { wch: 32 }, // Operation Type
    { wch: 24 }, // Covering For
    { wch: 24 }, // Origin Branch
    { wch: 24 }, // Shift Timings
    { wch: 42 }, // Details & Notes
  ];
  XLSX.utils.book_append_sheet(workbook, relieverSheet, 'Relievers & Deputations');

  // -------------------------------------------------------------
  // TAB 5: Master Roster (All Records)
  // -------------------------------------------------------------
  const allExportData = cleanRecords.map((rec, index) => {
    let relieverDetails = '';
    if (rec.isReliever) {
      relieverDetails = `Reliever covering for ${rec.coveringFor || 'Absent Staff'}`;
      if (rec.relieverFromBranch) {
        relieverDetails += ` (From: ${rec.relieverFromBranch})`;
      }
    } else if (rec.relieverName) {
      relieverDetails = `Covered by Reliever: ${rec.relieverName}`;
      if (rec.relieverFromBranch) {
        relieverDetails += ` (From: ${rec.relieverFromBranch})`;
      }
    }

    return {
      'Sl. No': index + 1,
      'Branch': rec.branch || 'N/A',
      'Employee Name': rec.name || rec.employeeName || 'Unknown',
      'Role': getRoleLabel(rec),
      'Date': rec.date || 'N/A',
      'Status': rec.status || 'Present',
      'Check In': formatToDisplayTime(rec.checkIn),
      'Check Out': formatToDisplayTime(rec.checkOut),
      'Reliever / Deputation': relieverDetails,
      'Remarks': rec.notes || '',
    };
  });

  const allSheet = XLSX.utils.json_to_sheet(allExportData);
  allSheet['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 22 }, // Branch
    { wch: 24 }, // Employee Name
    { wch: 10 }, // Role
    { wch: 14 }, // Date
    { wch: 12 }, // Status
    { wch: 12 }, // Check In
    { wch: 12 }, // Check Out
    { wch: 38 }, // Reliever / Deputation
    { wch: 36 }, // Remarks
  ];
  XLSX.utils.book_append_sheet(workbook, allSheet, 'Master Roster (All)');

  // -------------------------------------------------------------
  // Write Workbook to browser download
  // -------------------------------------------------------------
  const filename = `Bangalore_Attendance_Report_${reportDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return true;
}
