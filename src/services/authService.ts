import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Use inside standalone PWA (iOS/Android) where popups are blocked */
export async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

/** Call once on app mount to capture the redirect result */
export async function checkGoogleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

export async function registerWithEmail(email: string, password: string, name: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  return result.user;
}

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}
