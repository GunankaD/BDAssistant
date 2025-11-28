import firestore from '@react-native-firebase/firestore';
import { getMeta, setMeta } from '../db/index';
import { upsertFromFirestoreBatch } from '../models/event.model';
import { applyDeletes } from '../models/delete.model';
import type { BirdEvent } from '../types';

const COLLECTION_NAME = 'birds';
const META_KEY = 'lastSyncedAt';
const PAGE_SIZE = 500;

const DELETES_COLLECTION = 'birdDeletes';
const META_DELETED_KEY = 'lastDeletedAt';

/** normalize Firestore doc -> BirdEvent */
function docToBirdEvent(id: string, data: any): BirdEvent {
  // timestamp may be Firestore Timestamp, number, or ISO string
  let tsIso: string;
  const t = data.timestamp;
  if (t && typeof t.toDate === 'function') {
    tsIso = t.toDate().toISOString();
  } else if (typeof t === 'number') {
    tsIso = new Date(t).toISOString();
  } else if (typeof t === 'string') {
    tsIso = t;
  } else {
    tsIso = new Date().toISOString();
  }

  return {
    id,
    species: data.species ?? undefined,
    soundName: data.soundName ?? undefined,
    timestamp: tsIso,
    imageUrl: data.imageUrl ?? undefined,
    location: data.location ?? undefined,
    device: data.device ?? undefined,
  };
}

/**
 * forcefull = false -> Incremental sync using @react-native-firebase/firestore
 * forcefull = true -> Fetches everything from the db disregarding our timestamp logic
 */
export async function syncFromFirestore(options?: {
  collectionName?: string;
  pageSize?: number;
  forceFull?: boolean;
  onProgress?: (nInserted: number) => void;
}) {
  const collectionName = options?.collectionName ?? COLLECTION_NAME;
  const pageSize = options?.pageSize ?? PAGE_SIZE;
  const onProgress = options?.onProgress;

  const colRef = firestore().collection(collectionName);
  const lastSyncedIso = await getMeta(META_KEY); // ISO string or null

  console.log('[SYNC] syncFromFirestore start', { collectionName, lastSyncedIso, forceFull: options?.forceFull  });

  // *) Helper to coerce a Firestore Timestamp or ISO string to ISO string
  const toIso = (raw: any) => {
    if (!raw) return null;
    if (raw.toDate) return raw.toDate().toISOString();
    if (typeof raw === 'string') return raw;
    return new Date(raw).toISOString();
  };

  // *) Helper to run paginated queryRef (queryRef must be an ascending-ordered query)
   async function runPaginated(queryRefBuilder: (startAfterValue?: any) => any, useFieldValueForStartAfter: boolean) {
    let lastDoc: any = null;             // DocumentSnapshot (for Timestamp case)
    let lastFieldValue: any = null;      // field value (for string case)
    let totalInserted = 0;

    while (true) {
      const q = useFieldValueForStartAfter
        ? (lastFieldValue ? queryRefBuilder(lastFieldValue) : queryRefBuilder())
        : (lastDoc ? queryRefBuilder(lastDoc) : queryRefBuilder());

      const snap = await q.get();
      if (snap.empty) break;

      const docs: BirdEvent[] = [];
      snap.forEach((d: any) => docs.push(docToBirdEvent(d.id, d.data())));
      console.log('[SYNC] fetched page docs:', docs.length, 'firstTs=', docs[0]?.timestamp, 'lastTs=', docs[docs.length - 1]?.timestamp);

      await upsertFromFirestoreBatch(docs);

      totalInserted += docs.length;
      // write meta as ISO string always
      const lastIso = toIso(snap.docs[snap.docs.length - 1].data().timestamp);
      await setMeta(META_KEY, lastIso);
      if (onProgress) onProgress(docs.length);

      if (snap.size < pageSize) break;

      // prepare for next page
      lastDoc = snap.docs[snap.docs.length - 1];
      lastFieldValue = lastDoc.data().timestamp;
    }

    return totalInserted;
  }

  try {
    // 1) Incremental (fast) — when we have a lastSyncedIso and not forcing full
    if (lastSyncedIso && !options?.forceFull) {
      try {
        console.log('[SYNC] running incremental sync');

        // detect storage type by sampling one doc (if any)
        const sampleSnap = await colRef.orderBy('timestamp', 'asc').limit(1).get();
        const usesTimestamp = !!sampleSnap.docs[0]?.data()?.timestamp?.toDate;
        console.log('[SYNC] detected timestamp type =', usesTimestamp ? 'Timestamp' : 'String');

        if (usesTimestamp) {
          // stored as Firestore Timestamp
          const lastTs = firestore.Timestamp.fromDate(new Date(lastSyncedIso));
          const incrementalBuilder = (startAfterDoc?: any) =>
            startAfterDoc
              ? colRef.where('timestamp', '>', lastTs).orderBy('timestamp', 'asc').startAfter(startAfterDoc).limit(pageSize)
              : colRef.where('timestamp', '>', lastTs).orderBy('timestamp', 'asc').limit(pageSize);

          const inserted = await runPaginated(incrementalBuilder, /*useFieldValueForStartAfter=*/ false);
          console.log(`[SYNC] incremental sync done! inserted: ${inserted} rows`);
          return { inserted, lastSyncedAt: await getMeta(META_KEY) };
        } else {
          // stored as ISO string; compare as string (ISO8601 sorts lexicographically)
          const lastIso = lastSyncedIso;
          const incrementalBuilder = (startAfterValue?: any) =>
            startAfterValue
              ? colRef.where('timestamp', '>', lastIso).orderBy('timestamp', 'asc').startAfter(startAfterValue).limit(pageSize)
              : colRef.where('timestamp', '>', lastIso).orderBy('timestamp', 'asc').limit(pageSize);

          const inserted = await runPaginated(incrementalBuilder, /*useFieldValueForStartAfter=*/ true);
          console.log(`[SYNC] incremental sync done! inserted: ${inserted} rows`);
          return { inserted, lastSyncedAt: await getMeta(META_KEY) };
        }
      } catch (err) {
        console.warn('Incremental query failed, falling back to safe approach:', err);
        // fall through to fallback (full sync) below
      }
    }

    // 2) Full fetch (forceFull === true OR no lastSyncedIso)
    if (options?.forceFull || !lastSyncedIso) {
      try {
        console.log('[SYNC] running fullfetch sync');

        const fullBuilder = (startAfterDoc?: any) =>
          startAfterDoc
            ? colRef.orderBy('timestamp', 'asc').startAfter(startAfterDoc).limit(pageSize)
            : colRef.orderBy('timestamp', 'asc').limit(pageSize);

        const inserted = await runPaginated(fullBuilder, false);
        console.log(`[SYNC] fullfetch sync done! inserted: ${inserted} rows`);

        return { inserted, lastSyncedAt: await getMeta(META_KEY) };
      } catch (err) {
        console.warn('Full fetch failed, falling back to recent fetch:', err);
        // fall through to fallback
      }
    }

    // 3) Fallback: fetch most recent PAGE_SIZE docs desc, reverse, filter locally
    {
      console.log('[SYNC] running fallback fetch (recent only)');

      const snap = await colRef.orderBy('timestamp', 'desc').limit(pageSize).get();
      if (snap.empty) return { inserted: 0, lastSyncedAt: await getMeta(META_KEY) };

      const docs: BirdEvent[] = [];
      snap.forEach((d: any) => docs.push(docToBirdEvent(d.id, d.data())));
      docs.reverse(); // ascending order

      const filtered = lastSyncedIso ? docs.filter(d => new Date(d.timestamp) > new Date(lastSyncedIso)) : docs;
      if (filtered.length > 0) {
        console.log('[SYNC] fallback fetched docs:', docs.length, 'lastSyncedIso=', lastSyncedIso);
        await upsertFromFirestoreBatch(filtered);
        await setMeta(META_KEY, filtered[filtered.length - 1].timestamp);
        await syncDeletesFromTombstones();

        if (onProgress) onProgress(filtered.length);
        return { inserted: filtered.length, lastSyncedAt: await getMeta(META_KEY) };
      }

      return { inserted: 0, lastSyncedAt: await getMeta(META_KEY) };
    }
  } catch (err) {
    console.error('syncFromFirestore overall failed:', err);
    throw err;
  }
}

/** Convenience for manual refresh */
export async function manualRefreshHistory() {
  return syncFromFirestore({ forceFull: false });
}

/** Gets called inside syncFromFirestore() to update LocalDB if any doc was deleted in Firestore */
export async function syncDeletesFromTombstones() {
  console.log('[DELETESYNC] running delete sync from tombstone collection');

  const lastDeletedIso = await getMeta(META_DELETED_KEY); // may be null
  console.log('[DELETESYNC] lastDeletedIso: ', lastDeletedIso);

  let q = firestore().collection(DELETES_COLLECTION).orderBy('deletedAt', 'asc').limit(500);
  if (lastDeletedIso) {
    try {
      q = q.where('deletedAt', '>', firestore.Timestamp.fromDate(new Date(lastDeletedIso)));
    } catch (err) {
       console.warn('[DELETESYNC] where(deletedAt) failed, continuing without where:', err);
    }
  }

  let snap;
  try {
    snap = await q.get();
  } catch (err) {
    console.error('[DELETESYNC] query failed:', err);
    return { deleted: 0, lastDeletedAt: lastDeletedIso };
  }

  if (snap.empty) {
    console.log('[DELETESYNC] snap is empty. nothing to delete. exiting...');
    return { deleted: 0, lastDeletedAt: lastDeletedIso };
  }

  const ids: string[] = [];
  let latestIso = lastDeletedIso;
  snap.forEach((d: any) => {
    ids.push(d.id);
    const dt = d.data()?.deletedAt;
    if (dt && typeof dt.toDate === 'function') latestIso = dt.toDate().toISOString();
    else if (typeof dt === 'string') latestIso = dt;
  });

  const count = await applyDeletes(ids);
  if (latestIso) await setMeta(META_DELETED_KEY, latestIso);

  console.log(`[DELETESYNC] delete sync done! deleted: ${count} rows`);
  return { deleted: count, lastDeletedAt: latestIso };
}