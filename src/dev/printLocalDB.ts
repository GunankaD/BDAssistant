import { queryRows } from '../db/index';

export async function printLocalDB(limit = 20) {
  try {
    console.log('[PrintLocalDB] --- bird_history table ---');
    const rows = await queryRows(`SELECT * FROM bird_history ORDER BY timestamp DESC LIMIT ?;`, [limit]);
    rows.forEach((r: any, i: number) => {
      console.log(`#${i + 1}`, {
        firestoreId: r.firestoreId,
        species: r.species,
        soundName: r.soundName,
        timestamp: new Date(r.timestamp).toLocaleString(),
        imageUrl: r.imageUrl,
        location: r.location,
        device: r.device,
      });
    });

    console.log('[PrintLocalDB] --- meta table ---');
    const meta = await queryRows(`SELECT * FROM meta;`);
    console.log(meta);
  } catch (err) {
    console.error('Failed to print local DB:', err);
  }
}