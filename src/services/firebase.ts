// Firebase bootstrap: anonymous auth + Realtime Database.
// Everything is lazy and failure-tolerant: when Firebase is unreachable
// (no network, web demo sandbox), callers get null and fall back to bots.

import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectDatabaseEmulator, Database, getDatabase } from 'firebase/database';

/** Local emulator mode for automated tests: open the web build with ?emu=1 */
const useEmulator = (): boolean =>
  typeof location !== 'undefined' && /[?&]emu=1/.test(location.search ?? '');

const firebaseConfig = {
  apiKey: 'AIzaSyDNXtB9uBeUtywd_5BYDh6jziYTj6CjBpE',
  authDomain: 'tungel.firebaseapp.com',
  databaseURL: 'https://tungel-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'tungel',
  storageBucket: 'tungel.firebasestorage.app',
  messagingSenderId: '116136948432',
  appId: '1:116136948432:web:16c1d15678215ff5ad64d5',
};

export interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Database;
  uid: string;
}

let handles: FirebaseHandles | null = null;

/** Initialize Firebase and sign in anonymously. Returns null on any failure. */
export async function getFirebase(): Promise<FirebaseHandles | null> {
  if (handles) return handles;
  try {
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);
    if (useEmulator()) {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectDatabaseEmulator(db, 'localhost', 9000);
      } catch {
        // already connected (hot reload) — fine
      }
    }
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    handles = { app, auth, db, uid };
    return handles;
  } catch {
    return null; // offline / blocked network -> bot fallback
  }
}
