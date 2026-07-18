/**
 * Import notes from an Evernote export (.enex) or a Markdown/plain-text file.
 *
 * ENEX is XML: each <note> has a <title>, an ENML <content> payload (usually
 * CDATA), <created>/<updated> stamps and zero+ <tag>s. We extract those, hand
 * the body to createNote (which sanitizes the HTML to our allowlist — ENML-only
 * tags like en-media/en-todo are simply unwrapped), and recreate the tags.
 * Markdown/plain files become a single note.
 *
 * Import is two-phase so the caller can put UI between picking and writing:
 *   pickImportFile()  → what's in the file (no DB writes)
 *   runImport(picked, target) → creates the notes in the chosen notebook
 *
 * The file's EXTENSION is never trusted: ENEX is detected by sniffing for the
 * <en-export> root, so a .enex renamed to .txt (or anything else) still imports
 * as ENEX, and the picker accepts every type.
 *
 * Image/media embeds in ENEX are not imported yet.
 */
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { runProtected } from '@core/security/appLockController';
import * as importsRepo from '@core/db/repositories/importsRepo';
import type { ImportRecord } from '@core/db/repositories/importsRepo';
import * as notebooksRepo from '@core/db/repositories/notebooksRepo';
import * as notesRepo from '@core/db/repositories/notesRepo';
import * as tagsRepo from '@core/db/repositories/tagsRepo';
import { DEFAULT_NOTEBOOK_COLOR } from '@features/notebooks/components/notebookColors';

export type ImportResult = { imported: number; source: 'enex' | 'text'; notebookId: string | null };

/** Reported after each note so the caller can show a progress indicator. */
export type ImportProgress = (done: number, total: number) => void;

/** Applied to every imported note so its origin stays visible and filterable. */
export const IMPORT_LABEL = 'EN import';

/** Reject imports larger than this; the whole file is read into memory and
 * regex-scanned, so an unbounded file could exhaust memory or hang the JS
 * thread. 50 MB comfortably covers large text/ENEX exports. */
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;

/** Thrown when the picked file exceeds MAX_IMPORT_BYTES. */
export const IMPORT_TOO_LARGE = 'IMPORT_TOO_LARGE';

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&[a-z]+;|&#39;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e);
}

function tagInner(block: string, tag: string): string | null {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(block);
  return m ? m[1] : null;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Evernote stamps are basic ISO 8601 with no separators ("20191101T061630Z"),
 * which `new Date()` does not parse portably. Returns undefined when absent or
 * malformed so the caller falls back to "now".
 */
export function parseEnexDate(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined;
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(raw.trim());
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m;
  const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  return Number.isFinite(ms) ? ms : undefined;
}

/** Strip the file extension to suggest a notebook name ("First Notebook.enex"). */
export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim();
}

/** ENEX detection sniffs content, never the extension. */
function isEnex(content: string): boolean {
  return /<en-export[\s>]/i.test(content);
}

function enexNoteBlocks(xml: string): string[] {
  return xml.match(/<note>[\s\S]*?<\/note>/gi) ?? [];
}

/** Where the imported notes should land. */
export type ImportTarget =
  /** Create a fresh notebook with this name and put everything in it. */
  | { mode: 'new-notebook'; name: string }
  /** Use an existing notebook (null = General / unfiled). */
  | { mode: 'existing'; notebookId: string | null };

/** A picked file, inspected but not yet imported. */
export type PickedImport = {
  fileName: string;
  content: string;
  source: 'enex' | 'text';
  /** How many notes the file holds (text files are always 1). */
  noteCount: number;
  /** Notebook name to offer when importing a multi-note export. */
  suggestedNotebookName: string;
  /** SHA-256 of the file content, for duplicate detection. */
  fileHash: string;
  /** Bytes read, for showing the storage cost of a re-import. */
  byteSize: number;
  /** A prior import of the identical file, if this one was imported before. */
  priorImport?: ImportRecord;
};

async function resolveTarget(target: ImportTarget): Promise<string | null> {
  if (target.mode === 'existing') return target.notebookId;
  const notebook = await notebooksRepo.createNotebook(
    target.name || 'Imported notes',
    DEFAULT_NOTEBOOK_COLOR,
  );
  return notebook.id;
}

/** Tag ids for a note: its own ENEX tags plus the import label. */
async function tagIdsFor(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of [...names, IMPORT_LABEL]) {
    const tag = await tagsRepo.getOrCreateTag(name);
    if (!ids.includes(tag.id)) ids.push(tag.id);
  }
  return ids;
}

/** Parse an ENEX document into notes and persist them. */
async function importEnex(
  xml: string,
  notebookId: string | null,
  onProgress?: ImportProgress,
): Promise<ImportResult> {
  let imported = 0;
  const blocks = enexNoteBlocks(xml);
  const total = blocks.length;

  for (const block of blocks) {
    const title = decodeEntities((tagInner(block, 'title') ?? '').trim()) || 'Imported note';

    // <content> is usually CDATA-wrapped ENML; fall back to entity-decoded.
    let content = '';
    const cdata = /<content>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/content>/i.exec(block);
    if (cdata) {
      content = cdata[1];
    } else {
      const raw = tagInner(block, 'content');
      if (raw) content = decodeEntities(raw);
    }
    // Unwrap the <en-note> root; the sanitizer drops remaining ENML tags.
    const enNote = /<en-note[^>]*>([\s\S]*?)<\/en-note>/i.exec(content);
    const bodyHtml = enNote ? enNote[1] : content;

    const createdAt = parseEnexDate(tagInner(block, 'created'));
    const updatedAt = parseEnexDate(tagInner(block, 'updated'));

    const created = await notesRepo.createNote({
      title,
      bodyHtml,
      notebookId,
      createdAt,
      updatedAt,
    });

    const tags = (block.match(/<tag>[\s\S]*?<\/tag>/gi) ?? [])
      .map((t) => decodeEntities(t.replace(/<\/?tag>/gi, '').trim()))
      .filter(Boolean);
    await notesRepo.setNoteTags(created.id, await tagIdsFor(tags));
    imported += 1;
    onProgress?.(imported, total);
  }

  return { imported, source: 'enex', notebookId };
}

/** Import a Markdown / plain-text file as a single note. */
async function importText(
  fileName: string,
  text: string,
  notebookId: string | null,
  onProgress?: ImportProgress,
): Promise<ImportResult> {
  const title = baseName(fileName) || 'Imported note';
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const created = await notesRepo.createNote({ title, bodyHtml: paragraphs, notebookId });
  await notesRepo.setNoteTags(created.id, await tagIdsFor([]));
  onProgress?.(1, 1);
  return { imported: 1, source: 'text', notebookId };
}

/**
 * Phase 1: pick a file and inspect it. Performs no DB writes, so the caller can
 * ask the user where the notes should go first. Returns null if they cancel.
 */
export async function pickImportFile(): Promise<PickedImport | null> {
  const result = await runProtected(() =>
    DocumentPicker.getDocumentAsync({
      type: ['application/octet-stream', 'text/*', 'application/xml', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    }),
  );
  if (result.canceled || !result.assets || result.assets.length === 0) return null;

  const asset = result.assets[0];
  if (typeof asset.size === 'number' && asset.size > MAX_IMPORT_BYTES) {
    throw new Error(IMPORT_TOO_LARGE);
  }
  const file = new File(asset.uri);
  // Guard again on the actual file size in case the picker didn't report one.
  if (typeof file.size === 'number' && file.size > MAX_IMPORT_BYTES) {
    throw new Error(IMPORT_TOO_LARGE);
  }
  const content = await file.text();
  const fileName = asset.name ?? 'note';

  const enex = isEnex(content);
  const fileHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content);
  return {
    fileName,
    content,
    source: enex ? 'enex' : 'text',
    noteCount: enex ? enexNoteBlocks(content).length : 1,
    suggestedNotebookName: baseName(fileName) || 'Imported notes',
    fileHash,
    byteSize: typeof file.size === 'number' ? file.size : content.length,
    priorImport: await importsRepo.findImportByHash(fileHash),
  };
}

/** Phase 2: write the picked file's notes into the chosen notebook. */
export async function runImport(
  picked: PickedImport,
  target: ImportTarget,
  onProgress?: ImportProgress,
): Promise<ImportResult> {
  const notebookId = await resolveTarget(target);
  const result =
    picked.source === 'enex'
      ? await importEnex(picked.content, notebookId, onProgress)
      : await importText(picked.fileName, picked.content, notebookId, onProgress);
  await importsRepo.recordImport({
    fileName: picked.fileName,
    fileHash: picked.fileHash,
    noteCount: result.imported,
    notebookId: result.notebookId,
  });
  return result;
}
