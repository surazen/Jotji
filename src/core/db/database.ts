/**
 * Encrypted SQLite database lifecycle + the ONLY place raw SQL is executed.
 *
 * Security: the connection is opened with a SQLCipher key from the device
 * keystore (see core/security/keystore). Every query goes through `all`/`first`/
 * `run` which require a static SQL string and a separate bound-params array —
 * user input is never concatenated into SQL. Repositories must use these
 * helpers exclusively.
 */
import { open, type DB, type Scalar } from '@op-engineering/op-sqlite';

import { getOrCreateDbKey } from '../security/keystore';
import { LATEST_VERSION, MIGRATIONS } from './migrations';

const DB_NAME = 'jotji.db';

let db: DB | null = null;

/** Open (once) the encrypted database and run pending migrations. */
export async function initDatabase(): Promise<void> {
  if (db) return;
  const encryptionKey = await getOrCreateDbKey();
  const instance = open({ name: DB_NAME, encryptionKey });

  // Per-connection pragmas (must run outside a transaction).
  await instance.execute('PRAGMA foreign_keys = ON;');
  await instance.execute('PRAGMA journal_mode = WAL;');

  await runMigrations(instance);
  db = instance;
}

function getDb(): DB {
  if (!db) throw new Error('Database accessed before initDatabase() completed.');
  return db;
}

async function runMigrations(instance: DB): Promise<void> {
  const res = await instance.execute('PRAGMA user_version;');
  const current = Number((res.rows?.[0] as { user_version?: number })?.user_version ?? 0);

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await instance.transaction(async (tx) => {
      for (const stmt of migration.statements) {
        await tx.execute(stmt);
      }
    });
    // version is an internal integer, never user input — safe to inline.
    // PRAGMA values can't be bound parameters, so this is the one allowed spot.
    // eslint-disable-next-line no-restricted-syntax
    await instance.execute(`PRAGMA user_version = ${migration.version};`);
  }

  if (LATEST_VERSION < current) {
    // The app is older than the database it opened; refuse rather than corrupt.
    throw new Error(`Database version ${current} is newer than supported ${LATEST_VERSION}.`);
  }
}

// ---- Parameterized query helpers (the SQL chokepoint) --------------------

export type Params = Scalar[];

/** Run a write/DDL statement; returns affected rows + last insert rowid. */
export async function run(
  sql: string,
  params: Params = [],
): Promise<{ rowsAffected: number; insertId?: number }> {
  const res = await getDb().execute(sql, params);
  return { rowsAffected: res.rowsAffected ?? 0, insertId: res.insertId };
}

/** Run a query and return all rows mapped to T. */
export async function all<T>(sql: string, params: Params = []): Promise<T[]> {
  const res = await getDb().execute(sql, params);
  return (res.rows ?? []) as unknown as T[];
}

/** Run a query and return the first row (or undefined). */
export async function first<T>(sql: string, params: Params = []): Promise<T | undefined> {
  const rows = await all<T>(sql, params);
  return rows[0];
}

/** Run several statements atomically. The callback receives bound helpers. */
export async function transaction(
  work: (tx: {
    run: (sql: string, params?: Params) => Promise<unknown>;
    all: <T>(sql: string, params?: Params) => Promise<T[]>;
  }) => Promise<void>,
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await work({
      run: (sql, params = []) => tx.execute(sql, params),
      all: async <T,>(sql: string, params: Params = []) => {
        const res = await tx.execute(sql, params);
        return (res.rows ?? []) as unknown as T[];
      },
    });
  });
}

/** Absolute on-disk path to the database file (used by diagnostics/tests). */
export function databasePath(): string {
  return getDb().getDbPath(DB_NAME);
}
