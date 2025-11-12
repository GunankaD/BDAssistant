import { writeTransaction } from '../db/index';

export async function applyDeletes(firestoreIds: string[]): Promise<number> {
  if (!firestoreIds || firestoreIds.length === 0) return 0;
  const CHUNK = 200;
  let deleted = 0;
  for (let i = 0; i < firestoreIds.length; i += CHUNK) {
    const chunk = firestoreIds.slice(i, i + CHUNK);
    await writeTransaction((tx: any) => {
      const placeholders = chunk.map(() => '?').join(',');
      tx.executeSql(`DELETE FROM bird_history WHERE firestoreId IN (${placeholders});`, chunk);
    });
    deleted += chunk.length;
  }
  return deleted;
}
