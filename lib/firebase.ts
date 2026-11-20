import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Checks whether valid Firebase environment variables are provided.
 */
export function isFirebaseConfigured(): boolean {
  const { apiKey, projectId } = firebaseConfig;
  return Boolean(
    apiKey &&
    projectId &&
    !apiKey.startsWith('YOUR_') &&
    !projectId.startsWith('YOUR_')
  );
}

/**
 * Initializes Firestore with auto-detecting long-polling.
 * This fixes the "Could not reach Cloud Firestore backend [code=unavailable]" error
 * caused by WebChannel streams being blocked by proxies/firewalls.
 */
function createFirestoreInstance(targetApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(targetApp, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(targetApp);
  }
}

/**
 * Initializes the Firebase application only once across existing instances.
 */
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = createFirestoreInstance(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export function getDb(): Firestore | undefined {
  if (!db && isFirebaseConfigured()) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      db = createFirestoreInstance(app);
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
  return db;
}

export { app, db, firebaseConfig };
