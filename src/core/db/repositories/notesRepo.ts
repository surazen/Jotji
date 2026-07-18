/**
 * Notes data access. All SQL is static; every value is a bound parameter.
 * Returns domain objects (camelCase), never raw rows.
 */
import { sanitizeHtml, htmlToPlainText } from '../../security/htmlSanitizer';
import { deleteSandboxFile } from '../../utils/files';
import { newId, nowMs } from '../../utils/ids';
import { all, first, run, transaction } from '../database';
import { buildFtsMatchQuery } from '../fts';
import type { Note, NoteWithRelations, SortKey, Tag } from '../types';

type NoteRow = {
  id: string;
  notebook_id: string | null;
  title: string;
  body_html: string;
  body_plain: string;
  is_pinned: number;
  created_at: number;
  updated_at: number;
};

type TagRow = { id: string; name: string; created_at: number; note_id?: string };

function mapNote(r: NoteRow): Note {
  return {
    id: r.id,
    notebookId: r.notebook_id,
    title: r.title,
    bodyHtml: r.body_html,
    bodyPlain: r.body_plain,
    isPinned: r.is_pinned === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function placeholders(n: number): string {
  return new Array(n).fill('?').join(',');
}

// ORDER BY column is chosen from a fixed allowlist (never user input).
const SORT_COLUMNS: Record<SortKey, string> = {
  updated: 'updated_at DESC',
  created: 'created_at DESC',
  title: 'title COLLATE NOCASE ASC',
};

export type ListOptions = {
  notebookId?: string;
  /** Only notes not in any notebook (the "General" bucket). */
  unfiled?: boolean;
  tagId?: string;
  sort?: SortKey;
  pinnedFirst?: boolean;
};

/** Attach tags + attachment counts to a set of notes in two batch queries. */
async function decorate(notes: Note[]): Promise<NoteWithRelations[]> {
  if (notes.length === 0) return [];
  const ids = notes.map((n) => n.id);

  const tagRows = await all<TagRow>(
    // Only generated `?` placeholders are interpolated; the ids are bound params.
    // eslint-disable-next-line no-restricted-syntax
    `SELECT t.id, t.name, t.created_at, nt.note_id
       FROM note_tags nt
       JOIN tags t ON t.id = nt.tag_id
      WHERE nt.note_id IN (${placeholders(ids.length)})
      ORDER BY t.name COLLATE NOCASE ASC`,
    ids,
  );
  const tagsByNote = new Map<string, Tag[]>();
  for (const row of tagRows) {
    const list = tagsByNote.get(row.note_id!) ?? [];
    list.push({ id: row.id, name: row.name, createdAt: row.created_at });
    tagsByNote.set(row.note_id!, list);
  }

  const countRows = await all<{ note_id: string; c: number }>(
    // Only generated `?` placeholders are interpolated; the ids are bound params.
    // eslint-disable-next-line no-restricted-syntax
    `SELECT note_id, COUNT(*) AS c
       FROM attachments
      WHERE note_id IN (${placeholders(ids.length)})
      GROUP BY note_id`,
    ids,
  );
  const countByNote = new Map(countRows.map((r) => [r.note_id, r.c]));

  return notes.map((n) => ({
    ...n,
    tags: tagsByNote.get(n.id) ?? [],
    attachmentCount: countByNote.get(n.id) ?? 0,
  }));
}

export async function listNotes(opts: ListOptions = {}): Promise<NoteWithRelations[]> {
  const { notebookId, unfiled, tagId, sort = 'updated', pinnedFirst = true } = opts;
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (notebookId) {
    where.push('notebook_id = ?');
    params.push(notebookId);
  }
  if (unfiled) {
    where.push('notebook_id IS NULL');
  }
  if (tagId) {
    where.push('id IN (SELECT note_id FROM note_tags WHERE tag_id = ?)');
    params.push(tagId);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = `ORDER BY ${pinnedFirst ? 'is_pinned DESC, ' : ''}${SORT_COLUMNS[sort]}`;

  // whereSql is built only from static fragments (values are bound in `params`)
  // and orderSql from the SORT_COLUMNS allowlist — no user input is interpolated.
  // eslint-disable-next-line no-restricted-syntax
  const rows = await all<NoteRow>(`SELECT * FROM notes ${whereSql} ${orderSql}`, params);
  return decorate(rows.map(mapNote));
}

/** Count of notes not in any notebook (the "General" bucket). */
export async function countUnfiledNotes(): Promise<number> {
  const row = await first<{ c: number }>(
    `SELECT COUNT(*) AS c FROM notes WHERE notebook_id IS NULL`,
  );
  return row?.c ?? 0;
}

/** Notes pinned to the top (for the horizontal pinned row). */
export async function listPinnedNotes(): Promise<NoteWithRelations[]> {
  const rows = await all<NoteRow>(
    `SELECT * FROM notes WHERE is_pinned = 1 ORDER BY updated_at DESC`,
  );
  return decorate(rows.map(mapNote));
}

/** Full-text search. Empty/operator-only queries return []. */
/**
 * Full-text search over notes. Pass `notebookId` to scope to one notebook
 * (null = the unfiled "General" bucket); omit it to search every note.
 */
export async function searchNotes(
  queryText: string,
  notebookId?: string | null,
): Promise<NoteWithRelations[]> {
  const match = buildFtsMatchQuery(queryText);
  if (!match) return [];
  const where = ['notes_fts MATCH ?'];
  const params: (string | null)[] = [match];
  if (notebookId !== undefined) {
    if (notebookId === null) {
      where.push('n.notebook_id IS NULL');
    } else {
      where.push('n.notebook_id = ?');
      params.push(notebookId);
    }
  }
  const rows = await all<NoteRow>(
    `SELECT n.* FROM notes n
       JOIN notes_fts f ON n.rowid = f.rowid
      WHERE ${where.join(' AND ')}
      ORDER BY rank`,
    params,
  );
  return decorate(rows.map(mapNote));
}

export async function getNote(id: string): Promise<NoteWithRelations | undefined> {
  const row = await first<NoteRow>(`SELECT * FROM notes WHERE id = ?`, [id]);
  if (!row) return undefined;
  const [decorated] = await decorate([mapNote(row)]);
  return decorated;
}

export type CreateNoteInput = {
  title?: string;
  bodyHtml?: string;
  notebookId?: string | null;
  /**
   * Original timestamps (epoch ms), for importers that carry a note's history
   * over from another app. Both default to "now", and `updatedAt` defaults to
   * `createdAt`, so ordinary note creation is unaffected.
   */
  createdAt?: number;
  updatedAt?: number;
};

export async function createNote(input: CreateNoteInput = {}): Promise<Note> {
  const id = newId();
  const now = nowMs();
  const createdAt = input.createdAt ?? now;
  const updatedAt = input.updatedAt ?? createdAt;
  const safeHtml = sanitizeHtml(input.bodyHtml ?? '');
  const plain = htmlToPlainText(safeHtml);
  await run(
    `INSERT INTO notes (id, notebook_id, title, body_html, body_plain, is_pinned, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, input.notebookId ?? null, input.title ?? '', safeHtml, plain, createdAt, updatedAt],
  );
  return {
    id,
    notebookId: input.notebookId ?? null,
    title: input.title ?? '',
    bodyHtml: safeHtml,
    bodyPlain: plain,
    isPinned: false,
    createdAt,
    updatedAt,
  };
}

export type UpdateNoteInput = {
  title?: string;
  bodyHtml?: string;
};

/** Update title/body. HTML is sanitized and body_plain re-derived here. */
export async function updateNote(id: string, patch: UpdateNoteInput): Promise<void> {
  const ts = nowMs();
  if (patch.bodyHtml !== undefined) {
    const safeHtml = sanitizeHtml(patch.bodyHtml);
    const plain = htmlToPlainText(safeHtml);
    if (patch.title !== undefined) {
      await run(
        `UPDATE notes SET title = ?, body_html = ?, body_plain = ?, updated_at = ? WHERE id = ?`,
        [patch.title, safeHtml, plain, ts, id],
      );
    } else {
      await run(`UPDATE notes SET body_html = ?, body_plain = ?, updated_at = ? WHERE id = ?`, [
        safeHtml,
        plain,
        ts,
        id,
      ]);
    }
  } else if (patch.title !== undefined) {
    await run(`UPDATE notes SET title = ?, updated_at = ? WHERE id = ?`, [patch.title, ts, id]);
  }
}

export async function setPinned(id: string, pinned: boolean): Promise<void> {
  await run(`UPDATE notes SET is_pinned = ?, updated_at = ? WHERE id = ?`, [
    pinned ? 1 : 0,
    nowMs(),
    id,
  ]);
}

export async function moveToNotebook(id: string, notebookId: string | null): Promise<void> {
  await run(`UPDATE notes SET notebook_id = ?, updated_at = ? WHERE id = ?`, [
    notebookId,
    nowMs(),
    id,
  ]);
}

/** Replace the full set of tags on a note (atomic). */
export async function setNoteTags(noteId: string, tagIds: string[]): Promise<void> {
  await transaction(async (tx) => {
    await tx.run(`DELETE FROM note_tags WHERE note_id = ?`, [noteId]);
    for (const tagId of tagIds) {
      await tx.run(`INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`, [
        noteId,
        tagId,
      ]);
    }
    await tx.run(`UPDATE notes SET updated_at = ? WHERE id = ?`, [nowMs(), noteId]);
  });
}

/** Delete a note and its attachment files (DB rows cascade automatically). */
export async function deleteNote(id: string): Promise<void> {
  const files = await all<{ local_uri: string }>(
    `SELECT local_uri FROM attachments WHERE note_id = ?`,
    [id],
  );
  await run(`DELETE FROM notes WHERE id = ?`, [id]);
  for (const f of files) deleteSandboxFile(f.local_uri);
}
