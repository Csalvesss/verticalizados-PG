/**
 * Netlify Scheduled Function: cleanup-stories
 *
 * Roda a cada hora e deleta stories com mais de 24h do Firestore.
 * Agende em netlify.toml com: schedule = "@hourly"
 *
 * Requer a env var FIREBASE_SERVICE_ACCOUNT (JSON do service account).
 */

import type { Config } from '@netlify/functions';

let adminApp: any = null;

async function getAdmin() {
  if (adminApp) return adminApp;
  const admin = await import('firebase-admin');
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (!admin.default.apps.length) {
    admin.default.initializeApp({ credential: admin.default.credential.cert(serviceAccount) });
  }
  adminApp = admin.default;
  return admin.default;
}

export default async function handler() {
  try {
    const admin = await getAdmin();
    const db = admin.firestore();

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snap = await db
      .collection('stories')
      .where('createdAt', '<', cutoff)
      .get();

    if (snap.empty) {
      console.log('[cleanup-stories] Nenhum story expirado.');
      return new Response('ok', { status: 200 });
    }

    const batch = db.batch();
    snap.docs.forEach((d: any) => batch.delete(d.ref));
    await batch.commit();

    console.log(`[cleanup-stories] Deletados ${snap.size} stories expirados.`);
    return new Response(`deleted ${snap.size}`, { status: 200 });
  } catch (err: any) {
    console.error('[cleanup-stories] Erro:', err);
    return new Response(err.message, { status: 500 });
  }
}

export const config: Config = {
  schedule: '@hourly',
};
