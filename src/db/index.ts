// src/db/index.ts
import SQLite from 'react-native-sqlite-storage';
import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import { runMigrations } from './migrations';

SQLite.DEBUG(false);
SQLite.enablePromise(false);

const DB_NAME = 'bd_assistant.db';
let _db: SQLiteDatabase | null = null;

/** Helper to normalize executeSql success callback args */
function normSuccessArgs(a: any, b?: any) {
  // If callback invoked as (res) => a is result
  // If invoked as (tx, res) => b is result
  return b ?? a;
}

/**
 * Open (or return) the DB connection.
 * Ensures migrations are run once on first open.
 */
export async function initDB(): Promise<SQLiteDatabase> {
  if (_db) return _db;

  return new Promise<SQLiteDatabase>((resolve, reject) => {
    try {
      console.log('[DB] opening DB:', DB_NAME);
      const db = SQLite.openDatabase(
        DB_NAME,
        '1.0',
        'BD Assistant DB',
        200000,
        async () => {
          console.log('[DB] open success, running migrations...');
          _db = db;
          try {
            const res = await runMigrations(db);
            console.log('[DB] migrations result:', res);
            resolve(db);
          } catch (migErr) {
            console.error('[DB] migrations failed:', migErr);
            reject(migErr);
          }
        },
        (err: any) => {
          console.error('[DB] open failed:', err);
          reject(err);
        }
      );
    } catch (err) {
      console.error('[DB] init threw:', err);
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
  const dbRef = _db;
  return new Promise((resolve, reject) => {
    try {
      dbRef.executeSql('PRAGMA wal_checkpoint(FULL);', [], (a: any, b: any) => {
        const res = normSuccessArgs(a, b);
        // ignore res content
        const closer = dbRef.close;
        if (!closer) {
          _db = null;
          resolve();
          return;
        }
        closer.call(dbRef, () => {
          _db = null;
          resolve();
        }, (err: any) => {
          console.warn('[DB] close error', err);
          reject(err);
        });
      }, (_a: any, _err: any) => {
        // ignore checkpoint error, attempt close anyway
        const closer = dbRef.close;
        if (!closer) {
          _db = null;
          resolve();
          return false;
        }
        closer.call(dbRef, () => {
          _db = null;
          resolve();
        }, (err: any) => {
          _db = null;
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
 * Read-only query returning rows as array
 */
export async function queryRows(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.executeSql(sql, params, (a: any, b: any) => {
      try {
        const res = normSuccessArgs(a, b);
        const rows: any[] = [];
        if (!res || !res.rows) {
          resolve([]);
          return;
        }
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    }, (a: any, err: any) => {
      // some implementations call error as single-arg; handle gracefully
      console.error('[DB] queryRows executeSql error:', err ?? a);
      reject(err ?? a);
      return false;
    });
  });
}

/**
 * Write transaction wrapper that fails if any executeSql fails.
 * fn receives tx; ensure to call tx.executeSql(...) inside it.
 */
export async function writeTransaction(fn: (tx: any) => void): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    let failed = false;
    db.transaction((tx: any) => {
      const origExecute = tx.executeSql.bind(tx);
      tx.executeSql = (sql: string, params?: any[], success?: any, error?: any) => {
        return origExecute(sql, params ?? [], (a: any, b: any) => {
          const res = normSuccessArgs(a, b);
          if (typeof success === 'function') success(res);
        }, (a: any, err: any) => {
          const e = err ?? a;
          failed = true;
          console.error('[DB] executeSql error:', e, 'sql:', sql);
          if (typeof error === 'function') error(e);
          // propagate as transaction error
          throw e;
        });
      };

      try {
        fn(tx);
      } catch (err) {
        throw err;
      }
    }, (txErr: any) => {
      console.error('[DB] transaction failed:', txErr);
      reject(txErr);
    }, () => {
      if (failed) {
        reject(new Error('One or more statements failed inside transaction (check logs)'));
      } else resolve();
    });
  });
}

/** Meta helpers */
export async function getMeta(key: string): Promise<string | null> {
  const db = await getDB();
  return new Promise((resolve) => {
    db.executeSql('SELECT value FROM meta WHERE key = ? LIMIT 1;', [key], (a: any, b: any) => {
      try {
        const res = normSuccessArgs(a, b);
        if (res && res.rows && res.rows.length > 0) resolve(res.rows.item(0).value);
        else resolve(null);
      } catch {
        resolve(null);
      }
    }, (_a: any, _err: any) => {
      resolve(null);
      return false;
    });
  });
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql('INSERT OR REPLACE INTO meta(key, value) VALUES(?, ?);', [key, value]);
    }, (txErr: any) => {
      reject(txErr);
    }, () => resolve());
  });
}

/** Helper: list tables (for debugging) */
export async function getTables(): Promise<string[]> {
  const rows = await queryRows(`SELECT name FROM sqlite_master WHERE type='table';`);
  return rows.map(r => r.name);
}