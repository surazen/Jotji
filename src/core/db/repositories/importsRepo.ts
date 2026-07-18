/** Import-history ledger — lets a re-import warn instead of silently duplicating. */
import { newId, nowMs } from '../../utils/ids';
import { first, run } from '../database';

export type ImportRecord = {
  id: string;
  fileName: string;
  fileHash: string;
  noteCount: number;
  notebookId: string | null;
  importedAt: number;
};

type ImportRow = {
  id: string;
  file_name: string;
  file_hash: string;
  note_count: number;
  notebook_id: string | null;
  imported_at: number;
};

function mapImport(r: ImportRow): ImportRecord {
  return {
    id: r.id,
    fileName: r.file_name,
    fileHash: r.file_hash,
    noteCount: r.note_count,
    notebookId: r.notebook_id,
    importedAt: r.imported_at,
  };
}

/** The most recent prior import of a file with this content hash, if any. */
export async function findImportByHash(fileHash: string): Promise<ImportRecord | undefined> {
  const row = await first<ImportRow>(
    `SELECT * FROM imports WHERE file_hash = ? ORDER BY imported_at DESC LIMIT 1`,
    [fileHash],
  );
  return row ? mapImport(row) : undefined;
}

export async function recordImport(input: {
  fileName: string;
  fileHash: string;
  noteCount: number;
  notebookId: string | null;
}): Promise<void> {
  await run(
    `INSERT INTO imports (id, file_name, file_hash, note_count, notebook_id, imported_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId(), input.fileName, input.fileHash, input.noteCount, input.notebookId, nowMs()],
  );
}
