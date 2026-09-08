/**
 * Encrypted backup archive — export the entire database plus every attachment
 * and scanned-PDF file into a single, passphrase-encrypted file the user can
 * store off the device (Drive, Downloads, a cable copy), and restore on a fresh
 * install. This is Jotji's only recovery path: the app has no cloud, and an
 * uninstall/reset destroys both the encrypted DB and its Keystore key.
 *
 * The archive is itself a SQLCipher database keyed by the user's passphrase, so
 * we reuse the same vetted encryption op-sqlite already provides for the main
 * DB — no hand-rolled crypto. File bytes ride along as base64 inside it.
 *
 * Restore MERGES with `INSERT OR IGNORE` keyed on the original ids, so importing
 * the same backup twice never duplicates notes, and it never destroys data the
 * user already has.
 *
 * Part of core/db — the only place raw SQL runs. Every statement is a static
 * string with bound params; the table names below are schema constants, not
 * user input.
 */
import { open, type DB, type Scalar } from '@op-engineering/op-sqlite';
import { File } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';

import { persistBase64ScanToSandbox, persistBase64ToSandbox } from '../utils/files';
import { all, databaseDirectory, first, run, transaction } from './database';

const FORMAT_VERSION = 1;
const BACKUP_TMP = 'jotji-backup-tmp.db';

const BAD_PASSPHRASE =
  'Could not open the backup. Check the passphrase and that this is a Jotji backup file.';

export type BackupErrorCode = 'bad-passphrase' | 'needs-passphrase' | 'io';

/** A backup/restore failure with a stable code the UI maps to a message. */
export class BackupError extends Error {
  code: BackupErrorCode;
  constructor(code: BackupErrorCode, message: string) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
  }
}

export type RestoreSummary = {
  notes: number;
  notebooks: number;
  tags: number;
  attachments: number;
  scans: number;
};

// Plain, constraint-free mirrors of the live schema — just enough to hold the
// data. FTS/triggers/indexes are rebuilt by the live DB on restore.
const ARCHIVE_SCHEMA = [
  'CREATE TABLE meta (k TEXT PRIMARY KEY NOT NULL, v TEXT NOT NULL);',
  'CREATE TABLE notebooks (id TEXT PRIMARY KEY, name TEXT, color TEXT, created_at INTEGER, updated_at INTEGER);',
  'CREATE TABLE notes (id TEXT PRIMARY KEY, notebook_id TEXT, title TEXT, body_html TEXT, body_plain TEXT, is_pinned INTEGER, created_at INTEGER, updated_at INTEGER);',
  'CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT, created_at INTEGER);',
  'CREATE TABLE note_tags (note_id TEXT, tag_id TEXT, PRIMARY KEY (note_id, tag_id));',
  'CREATE TABLE attachments (id TEXT PRIMARY KEY, note_id TEXT, local_uri TEXT, mime TEXT, width INTEGER, height INTEGER, size INTEGER, created_at INTEGER);',
  'CREATE TABLE scanned_files (id TEXT PRIMARY KEY, filename TEXT, local_uri TEXT, size INTEGER, created_at INTEGER);',
  'CREATE TABLE profile (id INTEGER PRIMARY KEY, name TEXT, avatar_uri TEXT);',
  'CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);',
  'CREATE TABLE imports (id TEXT PRIMARY KEY, file_name TEXT, file_hash TEXT, note_count INTEGER, notebook_id TEXT, imported_at INTEGER);',
  'CREATE TABLE att_blob (id TEXT PRIMARY KEY, base64 TEXT);',
  'CREATE TABLE scan_blob (id TEXT PRIMARY KEY, base64 TEXT);',
];

const INS = {
  notebook: 'INSERT INTO notebooks (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  note: 'INSERT INTO notes (id, notebook_id, title, body_html, body_plain, is_pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  tag: 'INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)',
  noteTag: 'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)',
  attachment: 'INSERT INTO attachments (id, note_id, local_uri, mime, width, height, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  scan: 'INSERT INTO scanned_files (id, filename, local_uri, size, created_at) VALUES (?, ?, ?, ?, ?)',
  setting: 'INSERT INTO app_settings (key, value) VALUES (?, ?)',
  importRow: 'INSERT INTO imports (id, file_name, file_hash, note_count, notebook_id, imported_at) VALUES (?, ?, ?, ?, ?, ?)',
};

// Merge inserts into the live DB: skip anything whose id already exists.
const MERGE = {
  notebook: INS.notebook.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
  note: INS.note.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
  tag: INS.tag.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
  noteTag: INS.noteTag.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
  attachment: INS.attachment.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
  scan: INS.scan.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
  setting: INS.setting.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
  importRow: INS.importRow.replace('INSERT INTO', 'INSERT OR IGNORE INTO'),
};

type Row = Record<string, Scalar>;

function toUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/** Best-effort removal of a SQLite file and any journal/WAL siblings. */
function removeDbFiles(path: string): void {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    try {
      const f = new File(toUri(path + suffix));
      if (f.exists) f.delete();
    } catch {
      // Non-fatal: a stray temp file is cleaned up on the next run.
    }
  }
}

async function readRows(db: DB, sql: string): Promise<Row[]> {
  const res = await db.execute(sql);
  return (res.rows ?? []) as unknown as Row[];
}

async function readFileBase64(uri: string): Promise<string | null> {
  try {
    if (!new File(uri).exists) return null;
    return await readAsStringAsync(uri, { encoding: 'base64' });
  } catch {
    return null;
  }
}

// ---- Backup ---------------------------------------------------------------

/**
 * Build an archive of everything and return its on-disk path. Pass a
 * `passphrase` to encrypt it (SQLCipher); omit it for a plain, always-restorable
 * backup. The caller hands the file to the OS "save" picker, then deletes it.
 * Throws {@link BackupError} on failure.
 */
export async function createBackupArchive(passphrase?: string): Promise<{ path: string }> {
  const dir = databaseDirectory();
  removeDbFiles(`${dir}/${BACKUP_TMP}`);

  let archive: DB;
  try {
    archive = open(passphrase ? { name: BACKUP_TMP, encryptionKey: passphrase } : { name: BACKUP_TMP });
  } catch {
    throw new BackupError('io', 'Could not create the backup file.');
  }
  // No argument: returns <baseDir>/jotji-backup-tmp.db. Passing the name would
  // make op-sqlite create_directories() over the just-created file and throw.
  const path = archive.getDbPath();

  try {
    // A rollback journal (not WAL) keeps the archive a single portable file.
    await archive.execute('PRAGMA journal_mode = DELETE;');
    for (const stmt of ARCHIVE_SCHEMA) await archive.execute(stmt);

    await copyTable(archive, 'SELECT id, name, color, created_at, updated_at FROM notebooks', INS.notebook,
      (r) => [r.id, r.name, r.color, r.created_at, r.updated_at]);
    await copyTable(archive, 'SELECT id, notebook_id, title, body_html, body_plain, is_pinned, created_at, updated_at FROM notes', INS.note,
      (r) => [r.id, r.notebook_id, r.title, r.body_html, r.body_plain, r.is_pinned, r.created_at, r.updated_at]);
    await copyTable(archive, 'SELECT id, name, created_at FROM tags', INS.tag,
      (r) => [r.id, r.name, r.created_at]);
    await copyTable(archive, 'SELECT note_id, tag_id FROM note_tags', INS.noteTag,
      (r) => [r.note_id, r.tag_id]);
    await copyTable(archive, 'SELECT key, value FROM app_settings', INS.setting,
      (r) => [r.key, r.value]);
    await copyTable(archive, 'SELECT id, file_name, file_hash, note_count, notebook_id, imported_at FROM imports', INS.importRow,
      (r) => [r.id, r.file_name, r.file_hash, r.note_count, r.notebook_id, r.imported_at]);

    const profile = await first<Row>('SELECT id, name, avatar_uri FROM profile WHERE id = 1');
    if (profile) {
      await archive.execute('INSERT INTO profile (id, name, avatar_uri) VALUES (?, ?, ?)', [
        profile.id, profile.name, profile.avatar_uri,
      ]);
    }

    // Attachments + scans carry their file bytes alongside the metadata.
    const attachments = await all<Row>(
      'SELECT id, note_id, local_uri, mime, width, height, size, created_at FROM attachments',
    );
    for (const a of attachments) {
      await archive.execute(INS.attachment, [
        a.id, a.note_id, a.local_uri, a.mime, a.width, a.height, a.size, a.created_at,
      ]);
      const b64 = await readFileBase64(a.local_uri as string);
      if (b64) await archive.execute('INSERT INTO att_blob (id, base64) VALUES (?, ?)', [a.id, b64]);
    }

    const scans = await all<Row>('SELECT id, filename, local_uri, size, created_at FROM scanned_files');
    for (const s of scans) {
      await archive.execute(INS.scan, [s.id, s.filename, s.local_uri, s.size, s.created_at]);
      const b64 = await readFileBase64(s.local_uri as string);
      if (b64) await archive.execute('INSERT INTO scan_blob (id, base64) VALUES (?, ?)', [s.id, b64]);
    }

    await archive.execute('INSERT INTO meta (k, v) VALUES (?, ?)', ['format_version', String(FORMAT_VERSION)]);
    await archive.execute('INSERT INTO meta (k, v) VALUES (?, ?)', ['created_at', String(Date.now())]);
  } catch (e) {
    archive.close();
    removeDbFiles(path);
    if (e instanceof BackupError) throw e;
    throw new BackupError('io', 'Could not build the backup.');
  }

  archive.close();
  return { path };
}

async function copyTable(
  archive: DB,
  selectSql: string,
  insertSql: string,
  params: (r: Row) => Scalar[],
): Promise<void> {
  const rows = await all<Row>(selectSql);
  for (const r of rows) await archive.execute(insertSql, params(r));
}

// ---- Restore --------------------------------------------------------------

/**
 * Merge a `.jotjibackup` file into the live database and return a count of what
 * was newly added. Backups may be encrypted or not: call without a `passphrase`
 * first — if the file turns out to be encrypted, this throws
 * `BackupError('needs-passphrase')` and the caller re-invokes with the
 * passphrase. A wrong passphrase (or non-Jotji file) throws `'bad-passphrase'`.
 */
export async function restoreBackupArchive(
  pickedUri: string,
  passphrase?: string,
): Promise<RestoreSummary> {
  // The picked file is already a local cache copy (DocumentPicker with
  // copyToCacheDirectory). Open it in place by pointing op-sqlite's `location`
  // at its folder — do NOT copy it into the op-sqlite databases dir, because the
  // scoped file API can only write inside its own document/cache directories.
  const plainPath = pickedUri.replace(/^file:\/\//, '');
  const slash = plainPath.lastIndexOf('/');
  const location = plainPath.slice(0, slash);
  const name = plainPath.slice(slash + 1);

  let archive: DB;
  try {
    archive = open(
      passphrase ? { name, location, encryptionKey: passphrase } : { name, location },
    );
  } catch {
    throw new BackupError(passphrase ? 'bad-passphrase' : 'io', BAD_PASSPHRASE);
  }

  try {
    // Reading meta is the moment of truth. If it fails without a passphrase the
    // file is (most likely) encrypted → ask for one. If it fails *with* a
    // passphrase, the passphrase is wrong or it isn't a Jotji backup.
    let format: unknown;
    try {
      const res = await archive.execute('SELECT v FROM meta WHERE k = ?', ['format_version']);
      format = (res.rows?.[0] as { v?: string } | undefined)?.v;
    } catch {
      throw new BackupError(
        passphrase ? 'bad-passphrase' : 'needs-passphrase',
        passphrase ? BAD_PASSPHRASE : 'This backup is encrypted.',
      );
    }
    if (format == null) {
      throw new BackupError(
        passphrase ? 'bad-passphrase' : 'needs-passphrase',
        passphrase ? BAD_PASSPHRASE : 'This backup is encrypted.',
      );
    }

    const before = await liveCounts();

    // Load file-free rows, then insert them atomically (INSERT OR IGNORE by id).
    const notebooks = await readRows(archive, 'SELECT id, name, color, created_at, updated_at FROM notebooks');
    const notes = await readRows(archive, 'SELECT id, notebook_id, title, body_html, body_plain, is_pinned, created_at, updated_at FROM notes');
    const tags = await readRows(archive, 'SELECT id, name, created_at FROM tags');
    const noteTags = await readRows(archive, 'SELECT note_id, tag_id FROM note_tags');
    const settings = await readRows(archive, 'SELECT key, value FROM app_settings');
    const imports = await readRows(archive, 'SELECT id, file_name, file_hash, note_count, notebook_id, imported_at FROM imports');
    const archivedProfile = (await readRows(archive, 'SELECT id, name, avatar_uri FROM profile'))[0];

    await transaction(async (tx) => {
      for (const r of notebooks) await tx.run(MERGE.notebook, [r.id, r.name, r.color, r.created_at, r.updated_at]);
      for (const r of notes) await tx.run(MERGE.note, [r.id, r.notebook_id, r.title, r.body_html, r.body_plain, r.is_pinned, r.created_at, r.updated_at]);
      for (const r of tags) await tx.run(MERGE.tag, [r.id, r.name, r.created_at]);
      for (const r of noteTags) await tx.run(MERGE.noteTag, [r.note_id, r.tag_id]);
      for (const r of settings) await tx.run(MERGE.setting, [r.key, r.value]);
      for (const r of imports) await tx.run(MERGE.importRow, [r.id, r.file_name, r.file_hash, r.note_count, r.notebook_id, r.imported_at]);
    });

    // Only adopt the backup's profile if the user hasn't set one yet (fresh
    // reinstall). Never clobber a profile they've already personalised.
    const currentProfile = await first<Row>('SELECT name, avatar_uri FROM profile WHERE id = 1');
    if (
      archivedProfile &&
      currentProfile &&
      currentProfile.name === '' &&
      currentProfile.avatar_uri == null &&
      (archivedProfile.name || archivedProfile.avatar_uri)
    ) {
      await run('UPDATE profile SET name = ?, avatar_uri = ? WHERE id = 1', [
        (archivedProfile.name as string) ?? '',
        (archivedProfile.avatar_uri as string | null) ?? null,
      ]);
    }

    // Files can't be written inside the transaction — restore each new one to
    // the sandbox, then record it (still skipping ids that already exist).
    await restoreFiles(archive, 'attachments', 'att_blob');
    await restoreFiles(archive, 'scans', 'scan_blob');

    const after = await liveCounts();
    return {
      notes: after.notes - before.notes,
      notebooks: after.notebooks - before.notebooks,
      tags: after.tags - before.tags,
      attachments: after.attachments - before.attachments,
      scans: after.scans - before.scans,
    };
  } finally {
    archive.close();
    // Restore only reads, so no journal siblings are written; clean any up
    // defensively (the picked file's folder is the app cache — writable).
    for (const suffix of ['-wal', '-shm', '-journal']) {
      try {
        const f = new File(toUri(plainPath + suffix));
        if (f.exists) f.delete();
      } catch {
        // Non-fatal.
      }
    }
  }
}

async function restoreFiles(archive: DB, kind: 'attachments' | 'scans', blobTable: 'att_blob' | 'scan_blob'): Promise<void> {
  if (kind === 'attachments') {
    const rows = await readRows(archive, 'SELECT id, note_id, mime, width, height, created_at FROM attachments');
    for (const a of rows) {
      if (await first('SELECT 1 AS x FROM attachments WHERE id = ?', [a.id as string])) continue;
      const b64 = await readBlob(archive, blobTable, a.id as string);
      if (!b64) continue; // no bytes captured → can't restore a usable attachment
      const { uri, size } = await persistBase64ToSandbox(b64, a.id as string, a.mime as string);
      await run(MERGE.attachment, [a.id, a.note_id, uri, a.mime, a.width, a.height, size, a.created_at]);
    }
    return;
  }
  const rows = await readRows(archive, 'SELECT id, filename, created_at FROM scanned_files');
  for (const s of rows) {
    if (await first('SELECT 1 AS x FROM scanned_files WHERE id = ?', [s.id as string])) continue;
    const b64 = await readBlob(archive, blobTable, s.id as string);
    if (!b64) continue;
    const { uri, size } = await persistBase64ScanToSandbox(b64, s.id as string);
    await run(MERGE.scan, [s.id, s.filename, uri, size, s.created_at]);
  }
}

async function readBlob(archive: DB, table: 'att_blob' | 'scan_blob', id: string): Promise<string | null> {
  // `table` is one of two constants, never user input.
  const sql = table === 'att_blob'
    ? 'SELECT base64 FROM att_blob WHERE id = ?'
    : 'SELECT base64 FROM scan_blob WHERE id = ?';
  const res = await archive.execute(sql, [id]);
  return ((res.rows?.[0] as { base64?: string } | undefined)?.base64) ?? null;
}

async function liveCounts(): Promise<RestoreSummary> {
  const one = async (sql: string) => Number((await first<{ c: number }>(sql))?.c ?? 0);
  return {
    notes: await one('SELECT COUNT(*) AS c FROM notes'),
    notebooks: await one('SELECT COUNT(*) AS c FROM notebooks'),
    tags: await one('SELECT COUNT(*) AS c FROM tags'),
    attachments: await one('SELECT COUNT(*) AS c FROM attachments'),
    scans: await one('SELECT COUNT(*) AS c FROM scanned_files'),
  };
}
