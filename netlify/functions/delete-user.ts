/**
 * Netlify Function: /api/delete-user
 *
 * Deleta um usuário completamente: Firebase Auth + todos os dados no Firestore.
 * Só pode ser chamado por admins autenticados (verificação via ID token).
 *
 * Body: { idToken: string, targetUid: string, churchId?: string }
 */

import type { Handler } from '@netlify/functions';

const ADMIN_EMAIL = 'ads.cesaralves@gmail.com';

let adminApp: any = null;

async function getAdmin() {
  if (adminApp) return adminApp;
  const admin = await import('firebase-admin');
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  adminApp = admin;
  return admin;
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { idToken, targetUid } = body;

    if (!idToken || typeof idToken !== 'string') {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token não fornecido' }) };
    }

    if (!targetUid || typeof targetUid !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'targetUid inválido' }) };
    }

    const admin = await getAdmin();
    const db = admin.firestore();

    // Verificar se o chamador é admin
    const decoded = await admin.auth().verifyIdToken(idToken);
    const callerEmail = decoded.email || '';

    let isAdmin = callerEmail === ADMIN_EMAIL;
    if (!isAdmin) {
      const adminSnap = await db.collection('config').doc('admins').get();
      const adminEmails: string[] = adminSnap.exists ? (adminSnap.data()?.emails || []) : [];
      isAdmin = adminEmails.includes(callerEmail);
    }

    if (!isAdmin) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Sem permissão de administrador' }) };
    }

    // Verificar que não está tentando deletar o super admin
    const targetUser = await admin.auth().getUser(targetUid);
    if (targetUser.email === ADMIN_EMAIL) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Não é possível excluir o administrador principal' }) };
    }

    // ── Deletar dados no Firestore ────────────────────────────────────────────
    // Firebase batch tem limite de 500 operações; usamos múltiplos batches
    const batches: ReturnType<typeof db.batch>[] = [];
    let currentBatch = db.batch();
    let opCount = 0;

    const addDelete = (ref: any) => {
      if (opCount > 0 && opCount % 490 === 0) {
        batches.push(currentBatch);
        currentBatch = db.batch();
      }
      currentBatch.delete(ref);
      opCount++;
    };

    // 1. Posts globais (coleção /posts onde o app realmente salva)
    const postsSnap = await db
      .collection('posts')
      .where('userId', '==', targetUid)
      .get();
    postsSnap.docs.forEach((d: any) => addDelete(d.ref));

    // 2. Confirmações de presença em TODAS as igrejas (collection group)
    const confSnap = await db
      .collectionGroup('confirmacoes')
      .where('userId', '==', targetUid)
      .get();
    confSnap.docs.forEach((d: any) => addDelete(d.ref));

    // 3. Follows
    addDelete(db.collection('follows').doc(targetUid));

    // 4. Notificações do usuário
    const notifSnap = await db
      .collection('notifications')
      .where('toUid', '==', targetUid)
      .get();
    notifSnap.docs.forEach((d: any) => addDelete(d.ref));

    // 5. Perfil do usuário
    addDelete(db.collection('users').doc(targetUid));

    // Commit todos os batches
    batches.push(currentBatch);
    await Promise.all(batches.map(b => b.commit()));

    // 6. Deletar conta no Firebase Auth (por último)
    await admin.auth().deleteUser(targetUid);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err: any) {
    console.error('delete-user error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Erro interno' }),
    };
  }
};
