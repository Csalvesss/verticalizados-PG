import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * One-time migration: copies data from global root collections to
 * the church-scoped subcollections introduced in the multi-tenant refactor.
 * Skips if already migrated (tracked in localStorage) or if the church
 * already has data (nothing to migrate).
 */
export async function migrateGlobalDataToChurch(churchId: string) {
  const key = `migrated_v1_${churchId}`;
  if (localStorage.getItem(key)) return;

  try {
    // Only migrate church-scoped collections (posts/sorteios stay global)
    const cols = ['songs', 'cifras', 'membros', 'confirmacoes', 'eventos'];

    for (const col of cols) {
      const churchSnap = await getDocs(collection(db, 'churches', churchId, col));
      if (churchSnap.size > 0) continue; // already has data, skip

      const globalSnap = await getDocs(collection(db, col));
      for (const d of globalSnap.docs) {
        await setDoc(doc(db, 'churches', churchId, col, d.id), d.data());
      }
    }

    localStorage.setItem(key, '1');
  } catch {
    // Silent fail — migration will retry on next load
  }
}
