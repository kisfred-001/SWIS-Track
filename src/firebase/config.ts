import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Use the specific databaseId provisioned by AI Studio Firebase setup
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== ''
    ? firebaseConfig.firestoreDatabaseId
    : '(default)'
);
export const auth = getAuth(app);

// Validate connection to Firestore per Firebase skill specification
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('the client is offline') ||
        error.message.includes('unavailable') ||
        (error as { code?: string }).code === 'unavailable'
      ) {
        console.warn('Firestore operating in offline cache mode until backend connection is established.');
      } else {
        console.warn('Firestore initial connection status:', error.message);
      }
    }
  }
}
testConnection().catch(() => {});

export default app;
