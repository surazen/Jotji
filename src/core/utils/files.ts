/**
 * Attachment file handling. Picked files are copied into the app's private
 * document sandbox so they survive even if the original (cache/gallery) is
 * cleared, and so we never render arbitrary external URIs.
 *
 * Allowed attachment types: PNG, JPG (viewed inline), and PDF, XLS/XLSX,
 * DOC/DOCX (opened in their system viewer).
 */
import { Directory, File, Paths } from 'expo-file-system';
import { writeAsStringAsync } from 'expo-file-system/legacy';

const ATTACH_DIRNAME = 'attachments';
const SCANS_DIRNAME = 'scans';

export type MediaKind = 'image' | 'file';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/gif']);

const DOC_MIME = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Document-picker `type` filter for the allowed document formats. */
export const DOCUMENT_PICKER_TYPES = Array.from(DOC_MIME);

export function isAllowedImageMime(mime: string | null | undefined): boolean {
  return !!mime && IMAGE_MIME.has(mime.toLowerCase());
}

export function isAllowedAttachmentMime(mime: string | null | undefined): boolean {
  const m = (mime ?? '').toLowerCase();
  return IMAGE_MIME.has(m) || DOC_MIME.has(m);
}

/** Classify an allowed attachment as a viewable image or an openable file. */
export function mediaKindFromMime(mime: string | null | undefined): MediaKind {
  return isAllowedImageMime(mime) ? 'image' : 'file';
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

/** Short uppercase label for a document tile (PDF, XLS, DOC…). */
export function fileLabelFromMime(mime: string | null | undefined): string {
  const ext = EXT_BY_MIME[(mime ?? '').toLowerCase()];
  return ext ? ext.slice(1).toUpperCase() : 'FILE';
}

function extFor(sourceUri: string, mime: string): string {
  const fromMime = EXT_BY_MIME[mime.toLowerCase()];
  if (fromMime) return fromMime;
  const match = /\.([a-zA-Z0-9]{1,5})(?:\?.*)?$/.exec(sourceUri);
  return match ? `.${match[1].toLowerCase()}` : '';
}

function attachmentsDir(): Directory {
  const dir = new Directory(Paths.document, ATTACH_DIRNAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** Copy an allowed picked file into the sandbox. Returns its URI and byte size. */
export function persistToSandbox(
  sourceUri: string,
  id: string,
  mime: string,
): { uri: string; size: number | null } {
  if (!isAllowedAttachmentMime(mime)) throw new Error(`Unsupported attachment type: ${mime}`);
  const dir = attachmentsDir();
  const src = new File(sourceUri);
  const ext = src.extension || extFor(sourceUri, mime);
  const dest = new File(dir, `${id}${ext}`);
  src.copySync(dest);
  return { uri: dest.uri, size: dest.size ?? null };
}

function scansDir(): Directory {
  const dir = new Directory(Paths.document, SCANS_DIRNAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Copy a scanned PDF (produced in the cache) into the permanent scan library
 * sandbox. Returns its stored URI and byte size.
 */
export function persistScanToSandbox(sourceUri: string, id: string): { uri: string; size: number | null } {
  const dir = scansDir();
  const src = new File(sourceUri);
  const dest = new File(dir, `${id}.pdf`);
  src.copySync(dest);
  return { uri: dest.uri, size: dest.size ?? null };
}

/**
 * Write base64 bytes (an embedded Evernote resource) straight into the sandbox.
 * Whitespace in the base64 (ENEX wraps it) is stripped first. Async because it
 * goes through the legacy string-writer, which is the only base64 file writer.
 */
export async function persistBase64ToSandbox(
  base64: string,
  id: string,
  mime: string,
): Promise<{ uri: string; size: number | null }> {
  if (!isAllowedAttachmentMime(mime)) throw new Error(`Unsupported attachment type: ${mime}`);
  const dir = attachmentsDir();
  const ext = EXT_BY_MIME[mime.toLowerCase()] ?? '';
  const dest = new File(dir, `${id}${ext}`);
  await writeAsStringAsync(dest.uri, base64.replace(/\s/g, ''), { encoding: 'base64' });
  const written = new File(dest.uri);
  return { uri: written.uri, size: written.size ?? null };
}

/**
 * Write a base64-encoded scanned PDF straight into the scan-library sandbox.
 * Used by the backup restore path, which carries scan bytes inside the archive.
 */
export async function persistBase64ScanToSandbox(
  base64: string,
  id: string,
): Promise<{ uri: string; size: number | null }> {
  const dir = scansDir();
  const dest = new File(dir, `${id}.pdf`);
  await writeAsStringAsync(dest.uri, base64.replace(/\s/g, ''), { encoding: 'base64' });
  const written = new File(dest.uri);
  return { uri: written.uri, size: written.size ?? null };
}

/** Image-only variant kept for callers that must reject non-images. */
export function persistImageToSandbox(
  sourceUri: string,
  id: string,
  mime: string,
): { uri: string; size: number | null } {
  if (!isAllowedImageMime(mime)) throw new Error(`Unsupported image type: ${mime}`);
  return persistToSandbox(sourceUri, id, mime);
}

/** Best-effort delete of a sandbox attachment file. */
export function deleteSandboxFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Non-fatal: the DB row is the source of truth; a stray file is harmless.
  }
}
