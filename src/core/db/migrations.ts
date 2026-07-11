/**
 * Schema migrations, tracked via `PRAGMA user_version`.
 *
 * To evolve the schema, append a new entry to `MIGRATIONS` with the next
 * version number — never edit a shipped migration. Each migration's statements
 * run inside a single transaction.
 *
 * Notes on design:
 *  - All ids are TEXT UUIDs (generated app-side) for sync-friendliness later.
 *  - `updated_at` is set explicitly by repositories (no triggers) for
 *    predictable, single-writer timestamps.
 *  - Full-text search uses an external-content FTS5 table mirrored from `notes`
 *    via triggers on title/body_plain.
 *  - Deleting a notebook nulls its notes' notebook_id (notes survive).
 */

export type Migration = {
  version: number;
  statements: string[];
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE notebooks (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#006666',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`,

      `CREATE TABLE notes (
        id TEXT PRIMARY KEY NOT NULL,
        notebook_id TEXT REFERENCES notebooks(id) ON DELETE SET NULL,
        title TEXT NOT NULL DEFAULT '',
        body_html TEXT NOT NULL DEFAULT '',
        body_plain TEXT NOT NULL DEFAULT '',
        is_pinned INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
      `CREATE INDEX idx_notes_notebook ON notes(notebook_id);`,
      `CREATE INDEX idx_notes_updated ON notes(updated_at DESC);`,
      `CREATE INDEX idx_notes_pinned ON notes(is_pinned, updated_at DESC);`,

      `CREATE TABLE tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );`,
      `CREATE UNIQUE INDEX idx_tags_name ON tags(name);`,

      `CREATE TABLE note_tags (
        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (note_id, tag_id)
      );`,
      `CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);`,

      `CREATE TABLE attachments (
        id TEXT PRIMARY KEY NOT NULL,
        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        local_uri TEXT NOT NULL,
        mime TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        size INTEGER,
        created_at INTEGER NOT NULL
      );`,
      `CREATE INDEX idx_attachments_note ON attachments(note_id);`,

      `CREATE TABLE profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL DEFAULT '',
        avatar_uri TEXT
      );`,
      `INSERT INTO profile (id, name) VALUES (1, '');`,

      `CREATE TABLE app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`,

      // Full-text search over notes (external content table).
      `CREATE VIRTUAL TABLE notes_fts USING fts5(
        title,
        body_plain,
        content='notes',
        content_rowid='rowid',
        tokenize='unicode61 remove_diacritics 2'
      );`,
      `CREATE TRIGGER notes_fts_ai AFTER INSERT ON notes BEGIN
        INSERT INTO notes_fts(rowid, title, body_plain)
        VALUES (new.rowid, new.title, new.body_plain);
      END;`,
      `CREATE TRIGGER notes_fts_ad AFTER DELETE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid, title, body_plain)
        VALUES ('delete', old.rowid, old.title, old.body_plain);
      END;`,
      `CREATE TRIGGER notes_fts_au AFTER UPDATE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid, title, body_plain)
        VALUES ('delete', old.rowid, old.title, old.body_plain);
        INSERT INTO notes_fts(rowid, title, body_plain)
        VALUES (new.rowid, new.title, new.body_plain);
      END;`,
    ],
  },
  {
    version: 2,
    statements: [
      // Standalone scans (from the Scan tab) are auto-kept in a device-local
      // library, independent of notes. Files live in the app sandbox (scans/);
      // this table is the index over them.
      `CREATE TABLE scanned_files (
        id TEXT PRIMARY KEY NOT NULL,
        filename TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        size INTEGER,
        created_at INTEGER NOT NULL
      );`,
      `CREATE INDEX idx_scanned_files_created ON scanned_files(created_at DESC);`,
    ],
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
