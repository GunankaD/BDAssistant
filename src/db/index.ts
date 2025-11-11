import SQLite from 'react-native-sqlite-storage';
import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import { runMigrations } from './migrations';

SQLite.DEBUG(false);
SQLite.enablePromise(false); // we use callback-style DB object typing above

const DB_NAME = 'bd_assistant.db';
const DB_LOCATION: 'default' | 'Library' | 'Documents' = 'default';

let _db: SQLiteDatabase | null = null;

/**
 * Open (or return) the DB connection.
 * Ensures migrations are run once on first open.
 */
export async function initDB(): Promise<SQLiteDatabase> {
  if (_db) return _db;

  return new Promise<SQLiteDatabase>((resolve, reject) => {
    try {
      // openDatabase returns a DB object (callback style)
      const db = SQLite.openDatabase(DB_NAME, '1.0', 'BD Assistant DB', 200000, () => {
        // success open
        _db = db;
        // run migrations (safe to call; it uses PRAGMA user_version)
        runMigrations(db)
          .then(() => resolve(db))
          .catch((err) => {
            console.error('Migration error:', err);
            // still resolve with db so app can decide; but reject is also valid.
            reject(err);
          });
      }, (err: any) => {
        console.error('Failed open DB', err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Return DB if initialized, else init it.
 */
export async function getDB(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  return initDB();
}

/**
 * Close DB connection if open.
 */
export async function closeDB(): Promise<void> {
  if (!_db) return;
  return new Promise((resolve, reject) => {
    try {
      _db!.executeSql('PRAGMA wal_checkpoint(FULL);', [], () => {
        const closer = _db!.close;
        if (!closer) {
            _db = null;
            resolve();
            return;
        }
        closer.call(_db, () => {
            _db = null;
            resolve();
        }, (err: any) => {
            console.warn('closeDB error', err);
            reject(err);
        });
        
      }, (_tx: any, _err: any) => {
        // ignore checkpoint error, attempt close anyway
        const closer = _db!.close;
        if (!closer) {
            _db = null;
            resolve();
            return;
        }
        closer.call(_db, () => {
            _db = null;
            resolve();
        }, (err: any) => {
            console.warn('closeDB error', err);
            reject(err);
        });
        return false;
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Simple meta helpers (meta table created by migrations)
 */
export async function getMeta(key: string): Promise<string | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.executeSql(
      'SELECT value FROM meta WHERE key = ? LIMIT 1;',
      [key],
      (_tx: any, res: any) => {
        try {
          if (res.rows.length > 0) {
            resolve(res.rows.item(0).value);
          } else resolve(null);
        } catch (err) {
          resolve(null);
        }
      },
      (_tx: any, err: any) => {
        console.warn('getMeta error', err);
        resolve(null);
        return false;
      }
    );
  });
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?);',
        [key, value]
      );
    }, (txErr: any) => {
      reject(txErr);
    }, () => resolve());
  });
}

/**
 * Utility: run a read-only query and return rows as array
 */
export async function queryRows(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.executeSql(sql, params, (_tx: any, res: any) => {
      try {
        const rows: any[] = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        resolve(rows);
      } catch (err) {
        resolve([]);
      }
    }, (_tx: any, err: any) => {
      reject(err);
      return false;
    });
  });
}

/**
 * Utility: run an arbitrary write transaction (batch of statements)
 * callback receives a tx where you can call tx.executeSql(...)
 */
export async function writeTransaction(fn: (tx: any) => void): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      try {
        fn(tx);
      } catch (err) {
        // if user fn throws, rethrow to transaction error handler
        throw err;
      }
    }, (txErr: any) => {
      reject(txErr);
    }, () => resolve());
  });
}
