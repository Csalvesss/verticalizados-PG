/**
 * Netlify Function: /api/delete-user
 *
 * Deleta um usuário completamente: Firebase Auth + todos os dados no Firestore.
 * Só pode ser chamado por admins autenticados (verificação via ID token).
 *
 * Body: { idToken: string, targetUid: string, churchId: string }
 * Nota: token enviado no body (não no header Authorization) para evitar
 * interceptação pelo middleware do Netlify Identity.
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
    const { idToken, targetUid, churchId } = body;

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

    // Deletar dados no Firestore
    const batch = db.batch();

    // Posts da igreja
    if (churchId) {
      const postsSnap = await db
        .collection('churches').doc(churchId)
        .collection('posts')
        .where('userId', '==', targetUid)
        .get();
      postsSnap.docs.forEach((d: any) => batch.delete(d.ref));

      // Confirmações (presenças)
      const confSnap = await db
        .collection('churches').doc(churchId)
        .collection('confirmacoes')
        .where('userId', '==', targetUid)
        .get();
      confSnap.docs.forEach((d: any) => batch.delete(d.ref));
    }

    // Follows
    const followsRef = db.collection('follows').doc(targetUid);
    batch.delete(followsRef);

    // Perfil do usuário
    const userRef = db.collection('users').doc(targetUid);
    batch.delete(userRef);

    await batch.commit();

    // Deletar conta no Firebase Auth
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
