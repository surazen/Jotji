/** Scan-library data access + sandbox file lifecycle. Static SQL + bound params. */
import { deleteSandboxFile, persistScanToSandbox } from '../../utils/files';
import { newId, nowMs } from '../../utils/ids';
import { all, first, run } from '../database';
import type { ScannedFile } from '../types';

type ScannedFileRow = {
  id: string;
  filename: string;
  local_uri: string;
  size: number | null;
  created_at: number;
};

function mapScannedFile(r: ScannedFileRow): ScannedFile {
  return {
    id: r.id,
    filename: r.filename,
    localUri: r.local_uri,
    size: r.size,
    createdAt: r.created_at,
  };
}

/** Human-friendly default filename, e.g. "Scan 2026-07-11 17.42.pdf". */
function defaultFilename(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Scan ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}.pdf`;
}

export async function listScannedFiles(): Promise<ScannedFile[]> {
  const rows = await all<ScannedFileRow>(
    `SELECT * FROM scanned_files ORDER BY created_at DESC`,
  );
  return rows.map(mapScannedFile);
}

/** Copy a freshly scanned PDF into the library sandbox and record it. */
export async function addScannedFile(sourceUri: string): Promise<ScannedFile> {
  const id = newId();
  const ts = nowMs();
  const filename = defaultFilename(ts);
  const { uri, size } = persistScanToSandbox(sourceUri, id);
  await run(
    `INSERT INTO scanned_files (id, filename, local_uri, size, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, filename, uri, size, ts],
  );
  return { id, filename, localUri: uri, size, createdAt: ts };
}

/** Rename a scan. The stored filename always keeps a single ".pdf" suffix. */
export async function renameScannedFile(id: string, name: string): Promise<void> {
  const base = name.trim().replace(/\.pdf$/i, '');
  if (!base) return;
  await run(`UPDATE scanned_files SET filename = ? WHERE id = ?`, [`${base}.pdf`, id]);
}

export async function deleteScannedFile(id: string): Promise<void> {
  const row = await first<{ local_uri: string }>(
    `SELECT local_uri FROM scanned_files WHERE id = ?`,
    [id],
  );
  await run(`DELETE FROM scanned_files WHERE id = ?`, [id]);
  if (row) deleteSandboxFile(row.local_uri);
}

export async function deleteScannedFiles(ids: string[]): Promise<void> {
  for (const id of ids) {
    await deleteScannedFile(id);
  }
}
