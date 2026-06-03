/** Tag data access. Static SQL + bound params. */
import { newId, nowMs } from '../../utils/ids';
import { all, first, run } from '../database';
import type { Tag } from '../types';

type TagRow = { id: string; name: string; created_at: number };

function mapTag(r: TagRow): Tag {
  return { id: r.id, name: r.name, createdAt: r.created_at };
}

export type TagWithCount = Tag & { usageCount: number };

/** Normalize a tag label: strip leading '#', trim, lowercase, collapse spaces. */
export function normalizeTagName(raw: string): string {
  return raw.replace(/^#+/, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function listTags(): Promise<TagWithCount[]> {
  const rows = await all<TagRow & { usage_count: number }>(
    `SELECT t.*, COUNT(nt.note_id) AS usage_count
       FROM tags t
       LEFT JOIN note_tags nt ON nt.tag_id = t.id
      GROUP BY t.id
      ORDER BY usage_count DESC, t.name COLLATE NOCASE ASC`,
  );
  return rows.map((r) => ({ ...mapTag(r), usageCount: r.usage_count }));
}

export async function getTagsForNote(noteId: string): Promise<Tag[]> {
  const rows = await all<TagRow>(
    `SELECT t.* FROM tags t
       JOIN note_tags nt ON nt.tag_id = t.id
      WHERE nt.note_id = ?
      ORDER BY t.name COLLATE NOCASE ASC`,
    [noteId],
  );
  return rows.map(mapTag);
}

/** Find an existing tag by name or create it. Returns the canonical Tag. */
export async function getOrCreateTag(rawName: string): Promise<Tag> {
  const name = normalizeTagName(rawName);
  if (!name) throw new Error('Tag name is empty.');
  const existing = await first<TagRow>(`SELECT * FROM tags WHERE name = ?`, [name]);
  if (existing) return mapTag(existing);
  const id = newId();
  const ts = nowMs();
  await run(`INSERT OR IGNORE INTO tags (id, name, created_at) VALUES (?, ?, ?)`, [id, name, ts]);
  // Re-read to be safe against a concurrent insert winning the UNIQUE race.
  const row = await first<TagRow>(`SELECT * FROM tags WHERE name = ?`, [name]);
  return row ? mapTag(row) : { id, name, createdAt: ts };
}

export async function searchTags(prefix: string): Promise<TagWithCount[]> {
  const name = normalizeTagName(prefix);
  if (!name) return listTags();
  // LIKE with a bound parameter; '%' is part of the value, not the SQL.
  const rows = await all<TagRow & { usage_count: number }>(
    `SELECT t.*, COUNT(nt.note_id) AS usage_count
       FROM tags t
       LEFT JOIN note_tags nt ON nt.tag_id = t.id
      WHERE t.name LIKE ? ESCAPE '\\'
      GROUP BY t.id
      ORDER BY usage_count DESC, t.name COLLATE NOCASE ASC`,
    [`${name.replace(/[%_\\]/g, '\\$&')}%`],
  );
  return rows.map((r) => ({ ...mapTag(r), usageCount: r.usage_count }));
}

/** Delete a tag entirely (removes it from all notes via cascade). */
export async function deleteTag(id: string): Promise<void> {
  await run(`DELETE FROM tags WHERE id = ?`, [id]);
}
