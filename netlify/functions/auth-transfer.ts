/**
 * Netlify Function: /api/auth-transfer
 *
 * Troca um installToken temporário (gerado pelo client quando logado no browser)
 * por um Firebase Custom Token que o PWA standalone pode usar para fazer login.
 *
 * Fluxo:
 *  1. Browser (Safari/Chrome): usuário logado gera UUID → salva em Firestore installTokens/{uuid}
 *  2. Manifesto aponta start_url com ?t={uuid}
 *  3. PWA abre → lê ?t= → chama POST /api/auth-transfer { token: uuid }
 *  4. Esta função verifica o token, cria customToken Firebase e retorna
 *  5. PWA faz signInWithCustomToken(auth, customToken)
 *
 * Configuração necessária (Netlify Environment Variables):
 *  FIREBASE_SERVICE_ACCOUNT = conteúdo JSON da service account do Firebase
 *  (Firebase Console → Project Settings → Service Accounts → Generate new private key)
 */

import type { Handler } from '@netlify/functions';

let initialized = false;

async function getServices() {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
    initialized = true;
  } else if (!initialized) {
    initialized = true;
  }
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');
  return { db: getFirestore(), auth: getAuth() };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { token } = body;

    if (!token || typeof token !== 'string' || token.length < 10) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Token inválido' }) };
    }

    const { db, auth } = await getServices();

    const ref = db.collection('installTokens').doc(token);
    const snap = await ref.get();

    if (!snap.exists) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Token não encontrado' }) };
    }

    const data = snap.data()!;

    if (data.used) {
      return { statusCode: 410, body: JSON.stringify({ error: 'Token já utilizado' }) };
    }

    if (data.expiresAt < Date.now()) {
      return { statusCode: 410, body: JSON.stringify({ error: 'Token expirado' }) };
    }

    // Marca como usado antes de retornar (evita race conditions)
    await ref.update({ used: true, usedAt: Date.now() });

    // Gera Firebase Custom Token para o uid do usuário
    const customToken = await auth.createCustomToken(data.uid);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customToken }),
    };
  } catch (err: any) {
    console.error('auth-transfer error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) };
  }
};
