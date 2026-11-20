import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

const snap = await getDocs(collection(db, 'attendance'));
const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

const matches = all.filter(r => 
  (r.name && (r.name.toLowerCase().includes('ramesh') || r.name.toLowerCase().includes('vasu'))) ||
  (r.branch && r.branch.toLowerCase().includes('raja')) ||
  (r.coveringFor && r.coveringFor.toLowerCase().includes('vasu')) ||
  (r.relieverName && r.relieverName.toLowerCase().includes('ramesh'))
);

console.log('Total in Firestore:', all.length);
console.log('Matches:', JSON.stringify(matches, null, 2));
process.exit(0);

