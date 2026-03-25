import type { Handler } from '@netlify/functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const adminDb = admin.firestore();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: '' };

  try {
    const { toUserId, title, body } = JSON.parse(event.body || '{}');
    if (!toUserId || !title) {
      return { statusCode: 400, headers: CORS, body: 'Missing toUserId or title' };
    }

    const userSnap = await adminDb.doc(`users/${toUserId}`).get();
    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ sent: false, reason: 'no-token' }) };
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body: body || '' },
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: { link: '/' },
      },
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ sent: true }) };
  } catch (err: any) {
    // Token inválido/expirado — ignorar silenciosamente
    if (err?.code === 'messaging/registration-token-not-registered') {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ sent: false, reason: 'stale-token' }) };
    }
    console.error('send-notification error:', err);
    return { statusCode: 500, headers: CORS, body: 'Internal error' };
  }
};
