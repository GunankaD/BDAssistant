import type { SQLiteDatabase } from 'react-native-sqlite-storage';

type Migration = {
  id: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void> | void;
};

const migrations: Migration[] = [
  {
    id: 1,
    description: 'v1 - create bird_history & meta tables + indexes',
    up: (db) => {
      // Return a promise that resolves when the transaction commits
      return new Promise<void>((resolve, reject) => {
        try {
          db.transaction((tx: any) => {
            tx.executeSql(`PRAGMA foreign_keys = ON;`);

            tx.executeSql(`
              CREATE TABLE IF NOT EXISTS bird_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firestoreId TEXT UNIQUE,
                species TEXT,
                soundName TEXT,
                timestamp INTEGER NOT NULL,
                imageUrl TEXT,
                imagePath TEXT,
                imageCached INTEGER DEFAULT 0,
                location TEXT,
                device TEXT,
                createdAt INTEGER DEFAULT (strftime('%s','now') * 1000),
                lastModified INTEGER DEFAULT (strftime('%s','now') * 1000)
              );
            `);

            tx.executeSql(`
              CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY,
                value TEXT
              );
            `);

            tx.executeSql(`CREATE INDEX IF NOT EXISTS idx_bird_history_timestamp ON bird_history(timestamp DESC);`);
            tx.executeSql(`CREATE INDEX IF NOT EXISTS idx_bird_history_firestoreId ON bird_history(firestoreId);`);
            tx.executeSql(`CREATE INDEX IF NOT EXISTS idx_bird_history_imageCached ON bird_history(imageCached);`);
          }, (txErr: any) => {
            // transaction error
            reject(txErr);
          }, () => {
            // success
            resolve();
          });
        } catch (err) {
          reject(err);
        }
      });
    }
  }
  // future migrations: add more migration objects with id:2,3...
];

export async function getUserVersion(db: SQLiteDatabase): Promise<number> {
  return new Promise((resolve) => {
    db.executeSql(
      'PRAGMA user_version;',
      [],
      (tx: any, res: any) => {
        try {
          const value = res.rows.item(0).user_version;
          const ver = typeof value === 'number' ? value : parseInt(value || '0', 10);
          resolve(ver || 0);
        } catch (_err) {
          resolve(0);
        }
      },
      (tx: any, _err: any) => {
        resolve(0);
        return false;
      }
    );
  });
}

export async function setUserVersion(db: SQLiteDatabase, version: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.executeSql(
      `PRAGMA user_version = ${version};`,
      [],
      (tx: any, _res: any) => resolve(),
      (tx: any, err: any) => {
        reject(err);
        return false;
      }
    );
  });
}

export async function runMigrations(db: SQLiteDatabase): Promise<{ applied: number[]; currentVersion: number }> {
  const applied: number[] = [];
  const current = await getUserVersion(db);

  // apply migrations with id > current
  const pending = migrations.filter(m => m.id > current).sort((a, b) => a.id - b.id);

  for (const mig of pending) {
    try {
      // call migration up(); if it returns a Promise await it,
      // otherwise assume it executed SQL via its internal transaction
      const maybe = mig.up(db);
      if (maybe && typeof (maybe as Promise<void>).then === 'function') {
        await (maybe as Promise<void>);
      }

      // mark migration applied
      await setUserVersion(db, mig.id);
      applied.push(mig.id);
    } catch (err) {
      console.error(`Failed migration ${mig.id}:`, err);
      throw err;
    }
  }

  const finalVer = await getUserVersion(db);
  return { applied, currentVersion: finalVer };
}