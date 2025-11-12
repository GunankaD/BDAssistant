import { writeTransaction, queryRows } from '../db/index';
import type { BirdEvent, LocalDBSchema } from '../types';

/**
 * Helpers
 */
function toMs(ts: string | number | undefined): number {
  if (typeof ts === 'number') return ts;
  if (!ts) return Date.now();
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function locToString(loc: { lat: number; lng: number } | null | undefined): string | null {
  if (!loc) return null;
  try { return JSON.stringify(loc); } catch { return null; }
}

/**
 * Upsert a batch of Firestore BirdEvent docs into local DB.
 * Converts ISO timestamps to unix ms
 */
export async function upsertFromFirestoreBatch(docs: BirdEvent[]): Promise<void> {
  console.log('[UPSERT] upsertFromFirestoreBatch called, docs=', docs.length);
  if (!docs || docs.length === 0) return;

  const CHUNK = 200;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const chunk = docs.slice(i, i + CHUNK);
    try{

      await writeTransaction((tx: any) => {
        const sql = `
          INSERT INTO bird_history
            (firestoreId, species, soundName, timestamp, imageUrl, imagePath, imageCached, location, device, createdAt, lastModified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (strftime('%s','now') * 1000), ?)
          ON CONFLICT(firestoreId) DO UPDATE SET
            species = excluded.species,
            soundName = excluded.soundName,
            timestamp = excluded.timestamp,
            imageUrl = excluded.imageUrl,
            location = excluded.location,
            device = excluded.device,
            lastModified = excluded.lastModified
          WHERE excluded.timestamp > bird_history.lastModified;
        `;
  
        for (const d of chunk) {
          const ts = toMs(d.timestamp as any);
          const params = [
            d.id,                          // firestoreId
            d.species ?? null,
            d.soundName ?? null,
            ts,                            // timestamp (ms)
            d.imageUrl ?? null,            // imageUrl column
            null,                          // imagePath
            0,                             // imageCached
            locToString(d.location),       // location stored as JSON string
            d.device ?? null,
            ts                             // lastModified
          ];
          tx.executeSql(sql, params);
        }
      });
       console.log('[UPSERT] chunk upserted, size=', chunk.length);
    } catch (err) {
      console.error('[UPSERT] chunk upsert failed:', err);
      throw err;
    }
  }
}

/**
 * Insert a single BirdEvent locally (useful for local-only seeds).
 * Returns inserted local id if available.
 */
export async function insertEvent(doc: Partial<BirdEvent>): Promise<number | null> {
  let insertedId: number | null = null;
  await writeTransaction((tx: any) => {
    const sql = `
      INSERT INTO bird_history
        (firestoreId, species, soundName, timestamp, imageUrl, imagePath, imageCached, location, device, createdAt, lastModified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (strftime('%s','now') * 1000), (strftime('%s','now') * 1000));
    `;
    const ts = toMs((doc as any).timestamp);
    const params = [
      doc.id ?? null,
      doc.species ?? null,
      doc.soundName ?? null,
      ts,
      doc.imageUrl ?? null,
      null,
      0,
      locToString(doc.location),
      doc.device ?? null
    ];
    tx.executeSql(sql, params, (t: any, res: any) => {
      try { insertedId = res.insertId ?? null; } catch { insertedId = null; }
    });
  });
  return insertedId;
}

/**
 * Get recent bird rows, ordered by timestamp desc.
 * page is 0-based. pageSize default 30.
 */
export async function getRecent(page = 0, pageSize = 30): Promise<LocalDBSchema[]> {
  const offset = page * pageSize;
  const sql = `
    SELECT * FROM bird_history
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?;
  `;
  const rows = await queryRows(sql, [pageSize, offset]);
  return rows as LocalDBSchema[];
}

/**
 * Count total rows (useful for pagination UI)
 */
export async function countAll(): Promise<number> {
  const rows = await queryRows('SELECT COUNT(1) as cnt FROM bird_history;');
  if (rows && rows.length > 0) return Number(rows[0].cnt) || 0;
  return 0;
}
