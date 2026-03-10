import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}
