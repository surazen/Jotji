/** Attachment data access + sandbox file lifecycle. Static SQL + bound params. */
import { deleteSandboxFile, persistImageToSandbox } from '../../utils/files';
import { newId, nowMs } from '../../utils/ids';
import { all, first, run } from '../database';
import type { Attachment } from '../types';

type AttachmentRow = {
  id: string;
  note_id: string;
  local_uri: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number | null;
  created_at: number;
};

function mapAttachment(r: AttachmentRow): Attachment {
  return {
    id: r.id,
    noteId: r.note_id,
    localUri: r.local_uri,
    mime: r.mime,
    width: r.width,
    height: r.height,
    size: r.size,
    createdAt: r.created_at,
  };
}

export async function listAttachments(noteId: string): Promise<Attachment[]> {
  const rows = await all<AttachmentRow>(
    `SELECT * FROM attachments WHERE note_id = ? ORDER BY created_at ASC`,
    [noteId],
  );
  return rows.map(mapAttachment);
}

export type AddImageInput = {
  noteId: string;
  sourceUri: string;
  mime: string;
  width?: number | null;
  height?: number | null;
};

/** Copy a picked image into the sandbox and record it against a note. */
export async function addImageAttachment(input: AddImageInput): Promise<Attachment> {
  const id = newId();
  const ts = nowMs();
  const { uri, size } = persistImageToSandbox(input.sourceUri, id, input.mime);
  await run(
    `INSERT INTO attachments (id, note_id, local_uri, mime, width, height, size, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.noteId, uri, input.mime, input.width ?? null, input.height ?? null, size, ts],
  );
  return {
    id,
    noteId: input.noteId,
    localUri: uri,
    mime: input.mime,
    width: input.width ?? null,
    height: input.height ?? null,
    size,
    createdAt: ts,
  };
}

export async function deleteAttachment(id: string): Promise<void> {
  const row = await first<{ local_uri: string }>(
    `SELECT local_uri FROM attachments WHERE id = ?`,
    [id],
  );
  await run(`DELETE FROM attachments WHERE id = ?`, [id]);
  if (row) deleteSandboxFile(row.local_uri);
}
