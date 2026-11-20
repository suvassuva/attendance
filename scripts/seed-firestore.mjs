import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const data = JSON.parse(fs.readFileSync('lib/data/bangalore-data.json', 'utf8'));

async function seed() {
  console.log(`Starting Firestore seeding for ${data.attendanceRecords.length} records...`);
  let count = 0;
  for (const record of data.attendanceRecords) {
    const docId = `att_${record.date}_${record.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${record.employeeId}`;
    const docRef = doc(db, 'attendance', docId);
    await setDoc(docRef, {
      ...record,
      createdAt: serverTimestamp(),
    }, { merge: true });
    count++;
    if (count % 10 === 0 || count === data.attendanceRecords.length) {
      console.log(`Seeded ${count}/${data.attendanceRecords.length} records...`);
    }
  }
  console.log('✅ Firestore seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});

