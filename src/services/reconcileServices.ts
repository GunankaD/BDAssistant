import firestore from '@react-native-firebase/firestore';
import { queryRows } from '../db/index';
import { applyDeletes } from '../models/delete.model';

export async function reconcileDeletesFull(collectionName = 'birds') {
  console.log('[SYNC] running complete reconcile delete sync');

  // fetch all remote ids (paginated)
  const remoteIds: string[] = [];
  let lastDoc = null;
  while (true) {
    const q : any= lastDoc ?
      firestore().collection(collectionName).orderBy('__name__').startAfter(lastDoc).limit(500) :
      firestore().collection(collectionName).orderBy('__name__').limit(500);
    const snap: any = await q.get();
    if (snap.empty) break;
    snap.forEach((d: any) => remoteIds.push(d.id));
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < 500) break;
  }

  // local ids
  const local = await queryRows('SELECT firestoreId FROM bird_history WHERE firestoreId IS NOT NULL;');
  const toDelete = local.map((r:any) => r.firestoreId).filter((id:any) => !remoteIds.includes(id));
  if (toDelete.length === 0) return { deleted: 0 };
  const count = await applyDeletes(toDelete);

  console.log(`[SYNC] reconcile delete sync done. to delete: ${toDelete.length} rows, total deleted: ${count} rows`);
  
  return { deleted: toDelete.length };
}
