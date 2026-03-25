/**
 * Migração: remove músicas duplicadas de todas as igrejas no Firestore.
 *
 * Critério de duplicata: mesmo título (case-insensitive, sem espaços extras).
 * Quando há duplicatas, mantém o documento mais completo
 * (maior soma de: tamanho da letra + nº de sections * 10).
 * Em caso de empate, mantém o mais antigo (menor índice na lista retornada).
 *
 * Uso:
 *   FIREBASE_SERVICE_ACCOUNT='<json da service account>' node scripts/migrate-dedup-songs.mjs
 *
 * Ou salve o JSON em service-account.json e rode:
 *   node -e "process.env.FIREBASE_SERVICE_ACCOUNT=require('fs').readFileSync('service-account.json','utf8')" \
 *        scripts/migrate-dedup-songs.mjs
 *
 * A service account está em:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Inicializa Admin SDK ────────────────────────────────────────────────────
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  console.error('\n❌  FIREBASE_SERVICE_ACCOUNT não definida.\n');
  console.error('   Defina a variável de ambiente com o conteúdo JSON da service account:');
  console.error('   FIREBASE_SERVICE_ACCOUNT=\'{ ... }\' node scripts/migrate-dedup-songs.mjs\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);
if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Helpers ──────────────────────────────────────────────────────────────────
const normalizar = (v = '') => v.trim().toLowerCase().replace(/\s+/g, ' ');

const score = (doc) => {
  const d = doc.data();
  return (d.letra?.length ?? 0) + (Array.isArray(d.sections) ? d.sections.length * 10 : 0);
};

// ── Migração ─────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🔍  Buscando todas as igrejas…');
  const churchesSnap = await db.collection('churches').get();
  console.log(`    ${churchesSnap.size} igrejas encontradas.\n`);

  let totalDups = 0;
  let totalDeleted = 0;

  for (const churchDoc of churchesSnap.docs) {
    const churchId = churchDoc.id;
    const churchName = churchDoc.data().name ?? churchId;

    const songsSnap = await db.collection('churches').doc(churchId).collection('songs').get();
    if (songsSnap.empty) continue;

    // Agrupa por título normalizado
    const grupos = new Map();
    for (const s of songsSnap.docs) {
      const k = normalizar(s.data().title ?? '');
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(s);
    }

    const paraApagar = [];
    for (const [titulo, grupo] of grupos.entries()) {
      if (grupo.length <= 1) continue;
      totalDups += grupo.length - 1;

      // Mantém o mais completo
      const melhor = grupo.reduce((a, b) => (score(b) > score(a) ? b : a));
      const duplicatas = grupo.filter((s) => s.id !== melhor.id);
      duplicatas.forEach((s) => paraApagar.push(s.ref));

      console.log(
        `  ⚠️  "${churchName}" — "${titulo}": ${grupo.length} cópias → mantendo ${melhor.id}, apagando ${duplicatas.map((s) => s.id).join(', ')}`
      );
    }

    if (paraApagar.length === 0) continue;

    // Apaga em lotes de 500 (limite do Firestore)
    const BATCH_SIZE = 500;
    for (let i = 0; i < paraApagar.length; i += BATCH_SIZE) {
      const batch = db.batch();
      paraApagar.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    totalDeleted += paraApagar.length;
  }

  console.log('\n─────────────────────────────────────────');
  if (totalDeleted === 0) {
    console.log('✅  Nenhuma duplicata encontrada. Banco já está limpo!');
  } else {
    console.log(`✅  Concluído! ${totalDeleted} documento(s) duplicado(s) removido(s) de ${totalDups + totalDeleted - totalDups} grupos.`);
  }
  console.log('─────────────────────────────────────────\n');
}

run().catch((err) => {
  console.error('❌  Erro na migração:', err);
  process.exit(1);
});
