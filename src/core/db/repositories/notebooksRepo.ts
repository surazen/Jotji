/** Notebook data access. Static SQL + bound params. */
import { newId, nowMs } from '../../utils/ids';
import { all, first, run } from '../database';
import type { Notebook } from '../types';

type NotebookRow = {
  id: string;
  name: string;
  color: string;
  created_at: number;
  updated_at: number;
};

function mapNotebook(r: NotebookRow): Notebook {
  return { id: r.id, name: r.name, color: r.color, createdAt: r.created_at, updatedAt: r.updated_at };
}

export type NotebookWithCount = Notebook & { noteCount: number };

/** List notebooks with their note counts (for the 2/3-column grid). */
export async function listNotebooks(): Promise<NotebookWithCount[]> {
  const rows = await all<NotebookRow & { note_count: number }>(
    `SELECT nb.*, COUNT(n.id) AS note_count
       FROM notebooks nb
       LEFT JOIN notes n ON n.notebook_id = nb.id
      GROUP BY nb.id
      ORDER BY nb.name COLLATE NOCASE ASC`,
  );
  return rows.map((r) => ({ ...mapNotebook(r), noteCount: r.note_count }));
}

export async function getNotebook(id: string): Promise<Notebook | undefined> {
  const row = await first<NotebookRow>(`SELECT * FROM notebooks WHERE id = ?`, [id]);
  return row ? mapNotebook(row) : undefined;
}

export async function createNotebook(name: string, color: string): Promise<Notebook> {
  const id = newId();
  const ts = nowMs();
  await run(
    `INSERT INTO notebooks (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [id, name.trim(), color, ts, ts],
  );
  return { id, name: name.trim(), color, createdAt: ts, updatedAt: ts };
}

export async function renameNotebook(id: string, name: string): Promise<void> {
  await run(`UPDATE notebooks SET name = ?, updated_at = ? WHERE id = ?`, [name.trim(), nowMs(), id]);
}

export async function setNotebookColor(id: string, color: string): Promise<void> {
  await run(`UPDATE notebooks SET color = ?, updated_at = ? WHERE id = ?`, [color, nowMs(), id]);
}

/** Delete a notebook. Its notes are kept (notebook_id set to NULL via FK). */
export async function deleteNotebook(id: string): Promise<void> {
  await run(`DELETE FROM notebooks WHERE id = ?`, [id]);
}
