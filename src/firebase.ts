import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBIhT0pjEza4bxAsl7fWg19VJFHvKqKzdk',
  authDomain: 'verticalizados-pg.firebaseapp.com',
  projectId: 'verticalizados-pg',
  storageBucket: 'verticalizados-pg.firebasestorage.app',
  messagingSenderId: '10611554620',
  appId: '1:10611554620:web:a9efb1984120d042bb4639',
  measurementId: 'G-LH1QTWJ8BE',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);