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

/** iOS PWA standalone não compartilha cookies com Safari.
 *  signInWithPopup abre janela separada sem contas salvas.
 *  signInWithRedirect mantém o mesmo WKWebView e funciona corretamente. */
function isIOSStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export async function signInWithGoogle() {
  if (isIOSStandalone()) {
    await signInWithRedirect(auth, googleProvider);
    return null; // resultado tratado por getRedirectResultOnLoad()
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Chame uma vez no carregamento do app para capturar o resultado
 *  do signInWithRedirect (iOS PWA). onAuthStateChanged dispara na sequência. */
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

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}
