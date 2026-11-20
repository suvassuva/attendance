import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// 1. Delete redundant duplicate ramesh record: att_emp_9781_2026-11-20
try {
  await deleteDoc(doc(db, 'attendance', 'att_emp_9781_2026-11-20'));
  console.log('Deleted duplicate ramesh record: att_emp_9781_2026-11-20');
} catch (e) {
  console.log('Error deleting att_emp_9781_2026-11-20:', e.message);
}

// 2. Delete test record att_emp_9607_2026-11-20
try {
  await deleteDoc(doc(db, 'attendance', 'att_emp_9607_2026-11-20'));
  console.log('Deleted test record att_emp_9607_2026-11-20');
} catch (e) {
  console.log('Error deleting att_emp_9607_2026-11-20:', e.message);
}

// 3. Update reliever_2026-11-20_ramesh_4122 to have full details:
// phone: '9591345613', fromBranch: 'Basaveshwara Nagar', coveringFor: 'vasu', branch: 'Rajajinagar'
try {
  await updateDoc(doc(db, 'attendance', 'reliever_2026-11-20_ramesh_4122'), {
    relieverPhone: '9591345613',
    relieverFromBranch: 'Basaveshwara Nagar',
    coveringFor: 'vasu',
    notes: 'Covering duties for vasu at Rajajinagar',
  });
  console.log('Updated reliever ramesh with full details (phone, fromBranch, coveringFor)');
} catch (e) {
  console.log('Error updating reliever ramesh:', e.message);
}

// 4. Update vasu record (reliever_2026-11-20_vasu_0481) to show full reliever details:
// status: 'Absent', relieverName: 'ramesh', relieverPhone: '9591345613', relieverFromBranch: 'Basaveshwara Nagar'
try {
  await updateDoc(doc(db, 'attendance', 'reliever_2026-11-20_vasu_0481'), {
    status: 'Absent',
    role: 'Branch Manager',
    department: 'BM',
    relieverName: 'ramesh',
    relieverPhone: '9591345613',
    relieverFromBranch: 'Basaveshwara Nagar',
    notes: 'On leave - Covered by Reliever Ramesh',
    isReliever: false,
    coveringFor: '',
  });
  console.log('Updated vasu record to show status Absent with full reliever details');
} catch (e) {
  console.log('Error updating vasu record:', e.message);
}

process.exit(0);

