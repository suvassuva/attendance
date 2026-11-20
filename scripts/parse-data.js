const fs = require('fs');

const raw = fs.readFileSync('data/bangalore_attendance_2026-11-20.csv', 'utf8');
const lines = raw.trim().split(/\r?\n/);

console.log('Total lines:', lines.length);

const branchList = [];
const leaves = [];
const movements = [];
const activeAttendance = [];

// Branch Manager (BM) / Assistant Branch Manager (ABM) attendance for 2026-11-20
lines.slice(1).forEach((line, idx) => {
  const parts = line.split(',');
  const slNo = parts[0]?.trim();
  const branch = parts[1]?.trim();
  const bm = parts[2]?.trim();
  const abm = parts[3]?.trim();

  // Leave info columns: cols 5 to 8
  const leaveName = parts[5]?.trim();
  const leaveBranch = parts[6]?.trim();
  const leaveRole = parts[7]?.trim();
  const leaveStatus = parts[8]?.trim();

  if (leaveName && leaveStatus === 'Absent') {
    leaves.push({ name: leaveName, branch: leaveBranch, role: leaveRole || 'BM', status: 'Absent' });
  } else if (leaveName && leaveBranch && /^\d{10}$/.test(leaveBranch)) {
    // Movement / Reliever: Name, Phone, From, To, Date
    movements.push({
      name: leaveName,
      phone: leaveBranch,
      fromBranch: parts[7]?.trim(),
      toBranch: parts[8]?.trim(),
      date: parts[9]?.trim(),
    });
  }

  if (branch) {
    const isClosed = bm?.toLowerCase().includes('close') || abm?.toLowerCase().includes('close');
    branchList.push({
      slNo: Number(slNo) || idx + 1,
      name: branch,
      status: isClosed ? (bm?.toLowerCase().includes('permanent') ? 'Permanently Closed' : 'Closed') : 'Active',
      bm: isClosed ? '' : bm,
      abm: isClosed ? '' : abm,
    });

    if (!isClosed) {
      if (bm && !bm.toLowerCase().includes('close')) {
        activeAttendance.push({
          name: bm,
          role: 'Branch Manager',
          department: 'Branch Operations',
          branch: branch,
          status: 'Present',
          date: '2026-11-20',
          checkIn: '09:30',
          checkOut: '18:30',
        });
      }
      if (abm && !abm.toLowerCase().includes('close')) {
        activeAttendance.push({
          name: abm,
          role: 'Assistant Branch Manager',
          department: 'Branch Operations',
          branch: branch,
          status: 'Present',
          date: '2026-11-20',
          checkIn: '09:30',
          checkOut: '18:30',
        });
      }
    }
  }
});

console.log('Branches count:', branchList.length);
console.log('Closed branches:', branchList.filter(b => b.status !== 'Active').map(b => b.name));
console.log('Active staff attendance count:', activeAttendance.length);
console.log('Leaves count:', leaves.length);
console.log('Leaves detail:', JSON.stringify(leaves, null, 2));
console.log('Movements count:', movements.length);
console.log('Movements detail:', JSON.stringify(movements, null, 2));

