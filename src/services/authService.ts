import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true; // iOS PWA
  if (window.matchMedia('(display-mode: standalone)').matches) return true; // Android PWA
  return false;
}

/** Login com Google — usa redirect no standalone (iOS/Android), popup no browser */
export async function signInWithGoogle() {
  if (isStandalone()) {
    await signInWithRedirect(auth, googleProvider);
    return null; // resultado tratado por getRedirectResultOnLoad()
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Forçar redirect explicitamente (usado pela LoginScreen no standalone) */
export async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

/** Chame uma vez no carregamento do app para capturar o resultado
 *  do signInWithRedirect (iOS/Android PWA). onAuthStateChanged dispara na sequência. */
export async function getRedirectResultOnLoad() {
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

export async function loginWithEmail(email: string, password: string, rememberMe = true) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
