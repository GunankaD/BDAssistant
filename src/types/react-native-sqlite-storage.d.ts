declare module 'react-native-sqlite-storage' {
  export type ResultSet = {
    rows: { length: number; item: (i: number) => any };
  };

  // Transaction callback signatures: (tx, res) and (tx, err)
  export type Transaction = {
    executeSql: (
      sql: string,
      params?: any[],
      success?: (tx: Transaction, res: ResultSet) => void,
      error?: (tx: Transaction, err: any) => boolean | void
    ) => void;
  };

  export type SQLiteDatabase = {
    executeSql: (
      sql: string,
      params?: any[],
      success?: (tx: Transaction, res: ResultSet) => void,
      error?: (tx: Transaction, err: any) => boolean | void
    ) => void;

    transaction: (
      cb: (tx: Transaction) => void,
      error?: (err: any) => void,
      success?: () => void
    ) => void;

    // close the DB with optional callbacks
    close?: (success?: () => void, error?: (err: any) => void) => void;
  };

  // openDatabase supports optional callbacks for success/error (callback-style API)
  export function openDatabase(
    name: string,
    version?: string,
    displayName?: string,
    size?: number,
    success?: () => void,
    error?: (err: any) => void
  ): SQLiteDatabase;

  // module-level helpers present in the library
  export const DEBUG: (flag: boolean) => void;
  export const enablePromise: (flag: boolean) => void;

  const nativeModule: {
    openDatabase: typeof openDatabase;
    DEBUG: typeof DEBUG;
    enablePromise: typeof enablePromise;
  };

  export default nativeModule;
}
