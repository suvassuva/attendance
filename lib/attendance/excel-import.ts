import * as XLSX from 'xlsx';
import { Attendance, AttendanceStatus, Department, Branch } from '@/types/attendance';
import { MASTER_EMPLOYEES, BRANCHES } from '@/lib/dummy-data';
import { formatToHHmm } from './attendance-utils';

export interface ParsedAttendanceResult {
  records: Attendance[];
  totalParsed: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  pendingCount?: number;
  detectedDate: string;
  warnings: string[];
  fileName: string;
}

/**
 * Normalizes string key for fuzzy column matching
 * (e.g. "Employee Name ", "EMPLOYEE_NAME", "emp name" -> "employeename")
 */
function cleanKey(k: unknown): string {
  return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Known exact header tokens used to locate the table header row
 */
const EXACT_HEADERS = new Set([
  'branch',
  'branchname',
  'stationedbranch',
  'location',
  'office',
  'slno',
  'sl',
  'sno',
  'bm',
  'abm',
  'leavesstatus',
  'leavestatus',
  'leaves',
  'absentstaff',
  'employeename',
  'name',
  'staffname',
  'employee',
  'empname',
  'role',
  'designation',
  'department',
  'dept',
  'status',
  'attendancestatus',
  'date',
  'attendancedate',
  'checkin',
  'checkout',
  'intime',
  'outtime',
]);

/**
 * Extracts a value from a row object matching any of the candidate aliases
 */
function getField(row: Record<string, unknown>, aliases: string[]): string {
  const cleanAliases = aliases.map(cleanKey);
  for (const [key, val] of Object.entries(row)) {
    if (val === undefined || val === null) continue;
    const ck = cleanKey(key);
    if (cleanAliases.includes(ck)) {
      const strVal = String(val).trim();
      if (strVal) return strVal;
    }
  }
  return '';
}

/**
 * Normalizes attendance status string to standard AttendanceStatus
 */
function normalizeStatus(rawStatus?: string): AttendanceStatus {
  if (!rawStatus) return 'Present';
  const s = rawStatus.toLowerCase().trim();
  if (
    s.includes('absent') ||
    s.includes('leave') ||
    s === 'a' ||
    s === 'ab' ||
    s === 'l' ||
    s === 'off'
  ) {
    return 'Absent';
  }
  if (s.includes('late') || s.includes('delay')) {
    return 'Late';
  }
  if (s.includes('half')) {
    return 'Half-Day';
  }
  if (s.includes('pending')) {
    return 'Pending';
  }
  return 'Present';
}

/**
 * Validates if a cell content is a genuine employee name
 */
function isValidEmployeeName(raw: string): boolean {
  if (!raw) return false;
  const s = raw.toLowerCase().trim();
  if (s.length < 2) return false;

  const blockedTerms = [
    'total',
    'sl.no',
    'sl no',
    'slno',
    'employee name',
    'staff name',
    'emp name',
    'close',
    'closed',
    'permanent close',
    'permanent closed',
    'n/a',
    'none',
    'null',
    'undefined',
    'no present records found',
    'no absent records found',
    'metric',
    'value',
    'details',
    'present',
    'absent',
    'late',
    'leave',
    'status',
    'bm',
    'abm',
  ];

  if (blockedTerms.some((b) => s === b || s.startsWith(b + ' '))) {
    return false;
  }

  // Must contain at least one alphabet character
  if (!/[a-zA-Z]/.test(s)) {
    return false;
  }

  return true;
}

/**
 * Matches an extracted name with MASTER_EMPLOYEES for canonical IDs, department, and branch
 */
function matchMasterEmployee(name: string, branchHint?: string) {
  const cName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matches = MASTER_EMPLOYEES.filter(
    (m) => m.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cName
  );

  if (matches.length === 1) return matches[0];
  if (matches.length > 1 && branchHint) {
    const cBranch = branchHint.toLowerCase().replace(/[^a-z0-9]/g, '');
    const branchMatch = matches.find(
      (m) => (m.branch || '').toLowerCase().replace(/[^a-z0-9]/g, '') === cBranch
    );
    if (branchMatch) return branchMatch;
  }
  return matches[0] || null;
}

/**
 * Resolves branch name to standard Bangalore branch list
 */
function resolveBranch(rawBranch: string, fallback?: string): string {
  if (!rawBranch && fallback) return fallback;
  const cBranch = (rawBranch || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const found = BRANCHES.find(
    (b) => b.toLowerCase().replace(/[^a-z0-9]/g, '') === cBranch
  );
  return found || rawBranch.trim() || fallback || 'Bannerghatta';
}

/**
 * Normalizes date string into YYYY-MM-DD
 */
function parseDateString(rawDate: string, fallbackDate: string): string {
  if (!rawDate) return fallbackDate;
  const cleaned = rawDate.trim();
  const dateParts = cleaned.split(/[-/.]/);
  if (dateParts.length === 3) {
    // YYYY-MM-DD
    if (dateParts[0].length === 4) {
      return `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
    }
    // DD-MM-YYYY
    if (dateParts[2].length === 4) {
      return `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    }
  }
  return fallbackDate;
}

/**
 * Parses raw ArrayBuffer / Uint8Array of an Excel (.xlsx, .xls) or CSV file.
 * Resilient against:
 * 1. Multi-tab workbooks (Summary tabs, Master Roster tabs, Present/Absent tabs)
 * 2. Header row offsets (title banners or blank rows above table headers)
 * 3. 2-column Bangalore branch rosters (separate BM & ABM columns in a single row)
 * 4. Separate LEAVES STATUS / absent staff / reliever columns side-by-side
 * 5. Whitespace and case variations in column headers
 */
export async function parseAttendanceExcel(
  fileData: ArrayBuffer,
  fileName: string,
  targetDateFallback: string
): Promise<ParsedAttendanceResult> {
  const workbook = XLSX.read(fileData, { type: 'array', cellDates: true });
  const warnings: string[] = [];
  const records: Attendance[] = [];
  let detectedDate = targetDateFallback;

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded file does not contain any readable worksheets.');
  }

  // Summary tab names to ignore
  const ignoredSheetNames = new Set([
    'summary overview',
    'summary',
    'overview',
    'metrics',
    'dashboard',
    'report summary',
  ]);

  // Prioritize Master Roster or Template sheet if present
  const priorityMasterSheet = workbook.SheetNames.find((s) => {
    const ls = s.toLowerCase();
    return (
      ls.includes('master roster') ||
      ls.includes('attendance import template') ||
      ls.includes('all records') ||
      ls.includes('master')
    );
  });

  const sheetsToParse: string[] = priorityMasterSheet
    ? [priorityMasterSheet]
    : workbook.SheetNames.filter((s) => !ignoredSheetNames.has(s.toLowerCase().trim()));

  // Fallback: if all sheets were filtered out, parse sheet 0
  if (sheetsToParse.length === 0) {
    sheetsToParse.push(workbook.SheetNames[0]);
  }

  for (const sheetName of sheetsToParse) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Scan sheet as 2D array to detect best header row index
    const sheet2D: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    let headerRowIndex = 0;
    let maxHeaderMatches = 0;

    for (let r = 0; r < Math.min(sheet2D.length, 15); r++) {
      const rowArr = sheet2D[r];
      if (!Array.isArray(rowArr)) continue;

      let matchCount = 0;
      for (const cell of rowArr) {
        const ck = cleanKey(cell);
        if (EXACT_HEADERS.has(ck)) {
          matchCount++;
        }
      }

      if (matchCount > maxHeaderMatches) {
        maxHeaderMatches = matchCount;
        headerRowIndex = r;
      }
    }

    // Check title rows above header for dates (e.g. "Report - 20/11/2026")
    for (let r = 0; r < headerRowIndex; r++) {
      const rowArr = sheet2D[r];
      if (Array.isArray(rowArr)) {
        for (const cell of rowArr) {
          const str = String(cell || '');
          const dMatch =
            str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/) ||
            str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
          if (dMatch) {
            if (dMatch[3] && dMatch[3].length === 4) {
              detectedDate = `${dMatch[3]}-${dMatch[2].padStart(2, '0')}-${dMatch[1].padStart(2, '0')}`;
            } else if (dMatch[1] && dMatch[1].length === 4) {
              detectedDate = `${dMatch[1]}-${dMatch[2].padStart(2, '0')}-${dMatch[3].padStart(2, '0')}`;
            }
          }
        }
      }
    }

    // Convert sheet to JSON array starting from detected header row
    const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
      range: headerRowIndex,
      defval: '',
      raw: false,
    });

    if (rawRows.length === 0) continue;

    rawRows.forEach((row, rowIndex) => {
      // 1. Detect Branch
      const rawBranch = getField(row, [
        'Branch',
        'Branch Name',
        'Stationed Branch',
        'Location',
        'Office',
      ]);
      const branch = resolveBranch(rawBranch);

      // 2. Detect Date
      const rawDate = getField(row, [
        'Date',
        'Attendance Date',
        'Report Date',
        'Day',
        'Shift Date',
      ]);
      const rowDate = parseDateString(rawDate, detectedDate);
      if (rawDate && rowDate !== detectedDate) {
        detectedDate = rowDate;
      }

      // 3. Check for BM and ABM multi-column format (Native Bangalore Sheet)
      const bmVal = getField(row, ['B M', 'BM', 'Branch Manager']);
      const abmVal = getField(row, ['ABM', 'Assistant Branch Manager']);
      const hasTwoColumnStaff = Boolean(bmVal || abmVal);

      // Common row fields
      const rawStatus = getField(row, [
        'Status',
        'Attendance Status',
        'Attendance',
        'Present/Absent',
      ]);
      const rawCheckIn = getField(row, [
        'Check In',
        'In Time',
        'Time In',
        'Shift Timings',
        'Login',
      ]);
      const rawCheckOut = getField(row, [
        'Check Out',
        'Out Time',
        'Time Out',
        'Logout',
      ]);
      const rawRelieverName = getField(row, [
        'Covered By Reliever',
        'Covered By',
        'Reliever',
        'Reliever / Person',
        'Reliever Name',
      ]);
      const rawDeputedFrom = getField(row, [
        'Deputed From',
        'Origin Branch',
        'From Branch',
      ]);
      const rawCoveringFor = getField(row, ['Covering For', 'Covering']);
      const rawNotes = getField(row, [
        'Duty Remarks',
        'Remarks',
        'Remarks / Reason',
        'Details & Notes',
        'Notes',
        'Reason',
        'Leave Reason / Remarks',
      ]);

      // --- Mode A: Two-column BM & ABM (Bangalore native sheet) ---
      if (hasTwoColumnStaff) {
        // BM Entry
        if (isValidEmployeeName(bmVal)) {
          const matched = matchMasterEmployee(bmVal, branch);
          const name = matched?.name || bmVal;
          const status = normalizeStatus(rawStatus || 'Present');
          const isAbsent = status === 'Absent';
          const checkIn = isAbsent
            ? '--:--'
            : formatToHHmm(rawCheckIn || '09:30');
          const checkOut = isAbsent
            ? '--:--'
            : formatToHHmm(rawCheckOut || '18:30');
          const empId = matched?.employeeId || `EMP-BM-${1000 + rowIndex}`;
          const email =
            matched?.email ||
            `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`;

          records.push({
            id: `imp_${rowDate}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            employeeId: empId,
            name,
            employeeName: name,
            department: 'BM',
            role: 'Branch Manager',
            branch: matched?.branch || branch,
            date: rowDate,
            checkIn,
            checkOut,
            status,
            notes:
              rawNotes ||
              (isAbsent ? 'Reported Leave / Absent' : 'On-Duty regular hours'),
            isReliever: false,
            relieverName: rawRelieverName || undefined,
            relieverFromBranch: rawDeputedFrom || undefined,
            coveringFor: rawCoveringFor || undefined,
            email,
            createdAt: new Date().toISOString(),
          });
        }

        // ABM Entry
        if (isValidEmployeeName(abmVal)) {
          const matched = matchMasterEmployee(abmVal, branch);
          const name = matched?.name || abmVal;
          const status = normalizeStatus(rawStatus || 'Present');
          const isAbsent = status === 'Absent';
          const checkIn = isAbsent
            ? '--:--'
            : formatToHHmm(rawCheckIn || '09:45');
          const checkOut = isAbsent
            ? '--:--'
            : formatToHHmm(rawCheckOut || '18:30');
          const empId = matched?.employeeId || `EMP-ABM-${2000 + rowIndex}`;
          const email =
            matched?.email ||
            `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`;

          records.push({
            id: `imp_${rowDate}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            employeeId: empId,
            name,
            employeeName: name,
            department: 'ABM',
            role: 'Assistant Branch Manager',
            branch: matched?.branch || branch,
            date: rowDate,
            checkIn,
            checkOut,
            status,
            notes:
              rawNotes ||
              (isAbsent ? 'Reported Leave / Absent' : 'On-Duty regular hours'),
            isReliever: false,
            relieverName: rawRelieverName || undefined,
            relieverFromBranch: rawDeputedFrom || undefined,
            coveringFor: rawCoveringFor || undefined,
            email,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // --- Mode B: Single Employee Name column ---
        const singleName = getField(row, [
          'Employee Name',
          'Staff Name',
          'Name',
          'Employee',
          'Emp Name',
          'Absent Employee Name',
          'Reliever / Person',
          'Person',
        ]);

        if (isValidEmployeeName(singleName)) {
          const matched = matchMasterEmployee(singleName, branch);
          const name = matched?.name || singleName;

          // Determine department & role
          const roleRaw = getField(row, [
            'Role',
            'Designation',
            'Department',
            'Dept',
            'Position',
          ]);
          let department: Department = 'BM';
          let role = 'Branch Manager';

          if (
            matched?.department === 'ABM' ||
            roleRaw.toLowerCase().includes('assistant') ||
            roleRaw.toUpperCase() === 'ABM'
          ) {
            department = 'ABM';
            role = 'Assistant Branch Manager';
          }

          let status = normalizeStatus(rawStatus);
          if (
            sheetName.toLowerCase().includes('absent') ||
            singleName.toLowerCase().includes('absent')
          ) {
            status = 'Absent';
          }
          const isAbsent = status === 'Absent';

          const isRelieverSheet =
            sheetName.toLowerCase().includes('reliever') ||
            Boolean(getField(row, ['Operation Type']));
          const isReliever =
            isRelieverSheet ||
            Boolean(getField(row, ['Is Reliever'])?.toLowerCase() === 'yes');

          const checkIn = isAbsent
            ? '--:--'
            : formatToHHmm(
                rawCheckIn || (department === 'ABM' ? '09:45' : '09:30')
              );
          const checkOut = isAbsent
            ? '--:--'
            : formatToHHmm(rawCheckOut || '18:30');

          const empId =
            matched?.employeeId ||
            getField(row, ['Employee ID', 'Emp ID']) ||
            `EMP-${1000 + rowIndex}`;
          const email =
            matched?.email ||
            `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`;

          records.push({
            id: `imp_${rowDate}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            employeeId: empId,
            name,
            employeeName: name,
            department,
            role,
            branch: matched?.branch || branch,
            date: rowDate,
            checkIn,
            checkOut,
            status,
            notes:
              rawNotes ||
              (isAbsent
                ? rawRelieverName
                  ? `On leave - Covered by Reliever ${rawRelieverName}`
                  : 'Reported Leave / Absent'
                : 'On-Duty regular hours'),
            isReliever,
            relieverName: rawRelieverName || undefined,
            relieverFromBranch: rawDeputedFrom || undefined,
            coveringFor: rawCoveringFor || undefined,
            email,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // --- Mode C: Side-column Absent / Leaves & Relievers ---
      const leavesVal = getField(row, [
        'LEAVES STATUS',
        'Leave Status',
        'Leaves',
        'Absent Staff',
      ]);
      if (isValidEmployeeName(leavesVal)) {
        const rowValues = Object.values(row).map((v) => String(v || '').trim());
        const isRelieverRow = rowValues.some((v) => /^[0-9]{10}$/.test(v));

        if (isRelieverRow) {
          // Reliever entry
          const phone = rowValues.find((v) => /^[0-9]{10}$/.test(v)) || '';
          const matched = matchMasterEmployee(leavesVal, branch);
          const relieverName = matched?.name || leavesVal;

          records.push({
            id: `imp_${rowDate}_rel_${relieverName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            employeeId: matched?.employeeId || `REL-${4000 + rowIndex}`,
            name: relieverName,
            employeeName: relieverName,
            department: 'BM',
            role: 'Reliever Staff',
            branch: matched?.branch || branch,
            date: rowDate,
            checkIn: '09:30',
            checkOut: '18:30',
            status: 'Present',
            notes: `Inter-branch reliever deployed at ${branch}${phone ? ` (Ph: ${phone})` : ''}`,
            isReliever: true,
            email:
              matched?.email ||
              `${relieverName.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`,
            createdAt: new Date().toISOString(),
          });
        } else {
          // Absent employee entry
          const absentBranch =
            rowValues.find((v) =>
              BRANCHES.some((b) => b.toLowerCase() === v.toLowerCase().trim())
            ) || branch;

          const isABM = rowValues.some(
            (v) =>
              v.toUpperCase() === 'ABM' || v.toLowerCase().includes('assistant')
          );
          const matched = matchMasterEmployee(leavesVal, absentBranch);
          const absentName = matched?.name || leavesVal;

          records.push({
            id: `imp_${rowDate}_${absentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            employeeId: matched?.employeeId || `EMP-ABS-${3000 + rowIndex}`,
            name: absentName,
            employeeName: absentName,
            department: isABM ? 'ABM' : 'BM',
            role: isABM ? 'Assistant Branch Manager' : 'Branch Manager',
            branch: matched?.branch || absentBranch,
            date: rowDate,
            checkIn: '--:--',
            checkOut: '--:--',
            status: 'Absent',
            notes: 'Reported Leave / Absent',
            isReliever: false,
            email:
              matched?.email ||
              `${absentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
  }

  if (records.length === 0) {
    throw new Error(
      `No valid employee attendance records could be recognized in "${fileName}". Sheets checked: [${sheetsToParse.join(
        ', '
      )}]. Please verify your sheet contains an "Employee Name" (or "B M" / "ABM") column and "Branch".`
    );
  }

  // Deduplicate and merge records by unique key (name + date)
  const dedupMap = new Map<string, Attendance>();
  records.forEach((rec) => {
    const key = `${rec.name.toLowerCase().trim()}_${rec.date}`;
    const existing = dedupMap.get(key);

    if (!existing) {
      dedupMap.set(key, rec);
    } else {
      // If existing is Present but new one is Absent (from dedicated leaves section), prefer Absent
      if (existing.status === 'Present' && rec.status === 'Absent') {
        dedupMap.set(key, { ...existing, ...rec });
      } else if (rec.isReliever && !existing.isReliever) {
        dedupMap.set(key, { ...existing, ...rec });
      } else if (rec.relieverName && !existing.relieverName) {
        dedupMap.set(key, { ...existing, ...rec });
      } else if (rec.notes && !existing.notes) {
        dedupMap.set(key, { ...existing, notes: rec.notes });
      }
    }
  });

  const uniqueRecords = Array.from(dedupMap.values());

  const presentCount = uniqueRecords.filter((r) => r.status === 'Present').length;
  const absentCount = uniqueRecords.filter((r) => r.status === 'Absent').length;
  const lateCount = uniqueRecords.filter((r) => r.status === 'Late').length;
  const halfDayCount = uniqueRecords.filter((r) => r.status === 'Half-Day').length;
  const pendingCount = uniqueRecords.filter((r) => r.status === 'Pending').length;

  return {
    records: uniqueRecords,
    totalParsed: uniqueRecords.length,
    presentCount,
    absentCount,
    lateCount,
    halfDayCount,
    pendingCount,
    detectedDate,
    warnings,
    fileName,
  };
}

/**
 * Downloads a pre-formatted Excel template with all 62 employees ready for filling attendance.
 */
export function downloadAttendanceTemplate(targetDate: string) {
  const workbook = XLSX.utils.book_new();

  const templateRows = MASTER_EMPLOYEES.map((emp, index) => ({
    'SL No': index + 1,
    'Employee ID': emp.employeeId,
    'Employee Name': emp.name,
    'Role': emp.role,
    'Branch': emp.branch,
    'Date': targetDate,
    'Status': 'Present',
    'Check In': emp.department === 'ABM' ? '09:45' : '09:30',
    'Check Out': '18:30',
    'Covered By Reliever': '',
    'Notes': 'On-Duty regular hours',
  }));

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  worksheet['!cols'] = [
    { wch: 8 },  // SL No
    { wch: 14 }, // Employee ID
    { wch: 24 }, // Employee Name
    { wch: 24 }, // Role
    { wch: 22 }, // Branch
    { wch: 14 }, // Date
    { wch: 14 }, // Status
    { wch: 12 }, // Check In
    { wch: 12 }, // Check Out
    { wch: 22 }, // Covered By Reliever
    { wch: 30 }, // Notes
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Import Template');
  XLSX.writeFile(workbook, `Attendance_Template_${targetDate}.xlsx`);
}
