// Inicializa Firebase App, Firestore, Auth e Storage
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const timestamp = serverTimestamp;

// compatibilidade retroativa
export const provider = googleProvider;

// Força persistência via IndexedDB — mais durável em PWA/standalone iOS/Android.
// IndexedDB persiste mesmo quando o app é suspenso pelo sistema operacional.
setPersistence(auth, indexedDBLocalPersistence).catch(() => {
  // fallback silencioso — o auth ainda funciona com localStorage padrão
});
