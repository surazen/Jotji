/**
 * Canonical persistence entity types. The database is the source of truth for
 * these shapes; feature modules re-export them from their own `types.ts`.
 *
 * Timestamps are epoch milliseconds (INTEGER columns).
 */

export type Notebook = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
};

export type Note = {
  id: string;
  notebookId: string | null;
  title: string;
  bodyHtml: string;
  bodyPlain: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Tag = {
  id: string;
  name: string;
  createdAt: number;
};

export type Attachment = {
  id: string;
  noteId: string;
  localUri: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number | null;
  createdAt: number;
};

/** A standalone scanned PDF kept in the device-local scan library. */
export type ScannedFile = {
  id: string;
  filename: string;
  localUri: string;
  size: number | null;
  createdAt: number;
};

export type Profile = {
  name: string;
  avatarUri: string | null;
};

/** A note enriched with its tags + attachment count for list/detail rendering. */
export type NoteWithRelations = Note & {
  tags: Tag[];
  attachmentCount: number;
};

export type SortKey = 'updated' | 'created' | 'title';
