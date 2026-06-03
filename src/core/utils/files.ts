/**
 * Attachment file handling. Picked images are copied into the app's private
 * document sandbox so they survive even if the original (cache/gallery) is
 * cleared, and so we never render arbitrary external URIs in the editor WebView.
 */
import { Directory, File, Paths } from 'expo-file-system';

const ATTACH_DIRNAME = 'attachments';

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function isAllowedImageMime(mime: string | null | undefined): boolean {
  return !!mime && ALLOWED_IMAGE_MIME.has(mime.toLowerCase());
}

function extFromMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}

function attachmentsDir(): Directory {
  const dir = new Directory(Paths.document, ATTACH_DIRNAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Copy a picked image into the sandbox. Returns the sandbox URI and byte size.
 * Throws if the mime type is not an allowed image type.
 */
export function persistImageToSandbox(
  sourceUri: string,
  id: string,
  mime: string,
): { uri: string; size: number | null } {
  if (!isAllowedImageMime(mime)) {
    throw new Error(`Unsupported attachment type: ${mime}`);
  }
  const dir = attachmentsDir();
  const src = new File(sourceUri);
  const ext = src.extension || extFromMime(mime);
  const dest = new File(dir, `${id}${ext}`);
  src.copySync(dest);
  return { uri: dest.uri, size: dest.size ?? null };
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
