/**
 * Import notes from an Evernote export (.enex) or a Markdown/plain-text file.
 *
 * ENEX is XML: each <note> has a <title> and an ENML <content> payload (usually
 * CDATA). We extract title + body + tags, hand the body to createNote (which
 * sanitizes the HTML to our allowlist — ENML-specific tags like en-media/en-todo
 * are simply unwrapped), and recreate tags. Markdown/plain files become a single
 * note. Image/media embeds in ENEX are not imported.
 */
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { runProtected } from '@core/security/appLockController';
import * as notesRepo from '@core/db/repositories/notesRepo';
import * as tagsRepo from '@core/db/repositories/tagsRepo';

export type ImportResult = { imported: number; source: 'enex' | 'text' };

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

/** Parse an ENEX document into notes and persist them. */
async function importEnex(xml: string): Promise<ImportResult> {
  const noteBlocks = xml.match(/<note>[\s\S]*?<\/note>/gi) ?? [];
  let imported = 0;

  for (const block of noteBlocks) {
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

    const created = await notesRepo.createNote({ title, bodyHtml });

    const tags = (block.match(/<tag>[\s\S]*?<\/tag>/gi) ?? [])
      .map((t) => decodeEntities(t.replace(/<\/?tag>/gi, '').trim()))
      .filter(Boolean);
    if (tags.length) {
      const ids: string[] = [];
      for (const name of tags) {
        const tag = await tagsRepo.getOrCreateTag(name);
        ids.push(tag.id);
      }
      await notesRepo.setNoteTags(created.id, ids);
    }
    imported += 1;
  }

  return { imported, source: 'enex' };
}

/** Import a Markdown / plain-text file as a single note. */
async function importText(fileName: string, text: string): Promise<ImportResult> {
  const title = fileName.replace(/\.[^.]+$/, '').trim() || 'Imported note';
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  await notesRepo.createNote({ title, bodyHtml: paragraphs });
  return { imported: 1, source: 'text' };
}

/** Pick a file and import it. Returns null if the user cancels. */
export async function pickAndImport(): Promise<ImportResult | null> {
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
  const name = asset.name ?? 'note';

  if (/\.enex$/i.test(name) || content.includes('<en-export')) {
    return importEnex(content);
  }
  return importText(name, content);
}
