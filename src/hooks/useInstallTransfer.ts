/**
 * useInstallTransfer
 *
 * Dois propósitos:
 *
 * 1. GERAR TOKEN (quando usuário está logado no browser e vai instalar):
 *    - Cria installToken no Firestore com uid + expiresAt
 *    - Injeta um <link rel="manifest"> dinâmico com ?t=TOKEN no start_url
 *    - Chame prepareInstallToken(uid) antes de mostrar o prompt "Adicionar à tela de início"
 *
 * 2. CONSUMIR TOKEN (quando PWA abre com ?t= na URL):
 *    - Lê o token da URL
 *    - Chama a Netlify Function /api/auth-transfer
 *    - Faz signInWithCustomToken
 *    - Remove o ?t= da URL
 */

import { doc, setDoc } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { db, auth } from '../firebase';

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutos

/** Gera UUID simples (sem dependências externas) */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Atualiza o <link rel="manifest"> da página para incluir ?t=TOKEN */
function injectManifestWithToken(token: string) {
  const existing = document.querySelector('link[rel="manifest"]');
  const href = `/manifest.json?t=${token}`;
  if (existing) {
    existing.setAttribute('href', href);
  } else {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = href;
    document.head.appendChild(link);
  }
}

/**
 * Chame antes de mostrar o prompt de instalação.
 * Salva o token no Firestore e injeta no manifest.
 */
export async function prepareInstallToken(uid: string): Promise<string> {
  const token = uuid();
  await setDoc(doc(db, 'installTokens', token), {
    uid,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
    used: false,
  });
  injectManifestWithToken(token);
  return token;
}

/**
 * Chame no mount do App (antes de onAuthStateChanged resolver).
 * Se a URL tiver ?t=TOKEN, tenta fazer login automático via custom token.
 * Retorna true se conseguiu fazer login, false caso contrário.
 */
export async function consumeInstallToken(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('t');
  if (!token) return false;

  // Remove o token da URL imediatamente (independente do resultado)
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);

  try {
    const res = await fetch('/api/auth-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) return false;

    const { customToken } = await res.json();
    if (!customToken) return false;

    await signInWithCustomToken(auth, customToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook para verificar se há um token de instalação pendente.
 * Útil para mostrar loading enquanto processa.
 */
export function hasInstallToken(): boolean {
  return new URLSearchParams(window.location.search).has('t');
}
