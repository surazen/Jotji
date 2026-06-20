/**
 * Turn an Android share-sheet payload into a Jotji note.
 *
 * Shared text/URLs become the note body (the title is derived from page meta,
 * the link's host, or the first line). Shared images/documents are copied into
 * the sandbox as attachments. All HTML is built from escaped text and then
 * re-sanitized by `createNote`, so shared content can never inject markup.
 */
import * as attachmentsRepo from '@core/db/repositories/attachmentsRepo';
import * as notesRepo from '@core/db/repositories/notesRepo';
import { isAllowedAttachmentMime, isAllowedImageMime } from '@core/utils/files';
import type { ShareIntent } from 'expo-share-intent';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Extract a display host from an http(s) URL without relying on URL polyfills. */
function hostnameOf(url: string): string | null {
  const m = /^https?:\/\/([^/?#]+)/i.exec(url.trim());
  return m ? m[1].replace(/^www\./i, '') : null;
}

/** Replace a bare URL occurrence in already-escaped text with an anchor. */
function linkify(escapedText: string, url: string): string {
  const escUrl = escapeHtml(url);
  if (!escapedText.includes(escUrl)) return escapedText;
  return escapedText.split(escUrl).join(`<a href="${escapeHtml(url)}">${escUrl}</a>`);
}

function deriveTitle(shareIntent: ShareIntent): string {
  const metaTitle = shareIntent.meta?.title?.trim();
  if (metaTitle) return metaTitle.slice(0, 120);
  if (shareIntent.webUrl) {
    const host = hostnameOf(shareIntent.webUrl);
    if (host) return host;
  }
  const firstLine = (shareIntent.text ?? '').trim().split('\n')[0] ?? '';
  return firstLine.slice(0, 80);
}

function buildBodyHtml(shareIntent: ShareIntent): string {
  const text = (shareIntent.text ?? '').trim();
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const escaped = escapeHtml(block).replace(/\n/g, '<br>');
      const linked = shareIntent.webUrl ? linkify(escaped, shareIntent.webUrl) : escaped;
      return `<p>${linked}</p>`;
    })
    .join('');
}

/**
 * Create a note from a share payload. Returns the new note id, or null when the
 * payload had nothing usable (no text and no attachable files).
 */
export async function createNoteFromShare(shareIntent: ShareIntent): Promise<string | null> {
  const text = (shareIntent.text ?? '').trim();
  const files = shareIntent.files ?? [];
  const attachable = files.filter((f) => isAllowedAttachmentMime(f.mimeType));
  if (!text && attachable.length === 0) return null;

  const note = await notesRepo.createNote({
    title: deriveTitle(shareIntent),
    bodyHtml: buildBodyHtml(shareIntent),
  });

  for (const f of attachable) {
    try {
      if (isAllowedImageMime(f.mimeType)) {
        await attachmentsRepo.addImageAttachment({
          noteId: note.id,
          sourceUri: f.path,
          mime: f.mimeType,
          width: f.width,
          height: f.height,
        });
      } else {
        await attachmentsRepo.addAttachment({
          noteId: note.id,
          sourceUri: f.path,
          mime: f.mimeType,
        });
      }
    } catch {
      // Skip a file we couldn't copy; the note and any other files still save.
    }
  }

  return note.id;
}
