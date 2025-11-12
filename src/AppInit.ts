import { initDB, queryRows, setMeta } from './db/index';
import { syncFromFirestore, syncDeletesFromTombstones } from './services/syncService';
import { printLocalDB } from './dev/printLocalDB'
import { reconcileDeletesFull } from './services/reconcileServices'

export async function bootstrapApp(): Promise<void> {
  try {
    // 1) init db and run migrations
    console.log('[BOOTSTRAP] initDB start');
    await initDB();
    console.log('[BOOTSTRAP] DB initialized');

    // 2) run incremental deletes first (cheap) — catches deletes while app was closed
    console.log('[BOOTSTRAP] calling syncDeletesFromTombstones()');
    await syncDeletesFromTombstones();
    console.log('[BOOTSTRAP] synced with tombstone');
    
    // 3) sync LocalDB with Firestore
    console.log('[BOOTSTRAP] calling syncFromFirestore()');
    const result = await syncFromFirestore({ forceFull: false, pageSize: 1000 });
    console.log('[BOOTSTRAP] sync result', result);

    // 4) complete forceful delete sync
    // console.log('[BOOTSTRAP] starting Delete sync');
    // const deleteResult = await reconcileDeletesFull();
    // console.log('[BOOTSTRAP] Delete sync result: ', deleteResult);

  } catch (err) {
    console.error('bootstrapApp error', err);
  }
}