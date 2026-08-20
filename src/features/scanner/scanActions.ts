/**
 * Post-scan actions for a standalone scan (launched from the home FAB, not from
 * a note). Both consume the same cache PDF that {@link scanDocument} produces.
 * "Attach to a note" lives with the caller instead — it needs navigation.
 */
import { File, Paths } from 'expo-file-system';
import {
  getContentUriAsync,
  readAsStringAsync,
  StorageAccessFramework as SAF,
} from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

import { toast } from '@core/components/Toast';
import { runProtected } from '@core/security/appLockController';

const PDF_MIME = 'application/pdf';

/**
 * Fallback preview: open the PDF in the device's default reader via an Android
 * VIEW intent. Used only if the in-app {@link PdfViewer} is unavailable. Hands a
 * temporary content:// grant to the external app; if none can open PDFs we tell
 * the user to install one.
 */
export async function openPdfExternal(uri: string): Promise<void> {
  try {
    const contentUri = await getContentUriAsync(uri);
    await runProtected(() =>
      IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: PDF_MIME,
      }),
    );
  } catch {
    toast.error('No PDF reader found. Install one to preview.');
  }
}

/**
 * A share sheet sends the file under its on-disk name, which is the opaque
 * `<id>.pdf` we store scans as. When the user has given the scan a friendly
 * name, copy it into the cache under `<name>.pdf` first so the recipient sees
 * that name. Falls back to the original file if the copy fails. The cache copy
 * is short-lived and cleaned up by the OS.
 */
function scanShareUri(uri: string, displayName?: string): string {
  if (!displayName) return uri;
  const base = displayName.replace(/\.pdf$/i, '').replace(/[/\\:*?"<>|]+/g, '_').trim();
  if (!base) return uri;
  try {
    const dest = new File(Paths.cache, `${base}.pdf`);
    if (dest.exists) dest.delete();
    new File(uri).copySync(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

/** Share the scanned PDF via the OS share sheet (WhatsApp, Gmail, Drive, …). */
export async function sharePdf(uri: string, displayName?: string): Promise<void> {
  return shareScan(uri, 'Share scan', displayName);
}

/**
 * Hand the PDF to whatever AI app the user picks from the share sheet (Claude,
 * Gemini, …) so they can OCR / summarize / extract from it. Same mechanism as
 * {@link sharePdf} — the file itself is sent (a share intent can't carry a text
 * prompt with it, so the user asks their question in the AI app). Only the one
 * document the user chose ever leaves the device, and only when they pick a target.
 */
export async function sharePdfToAi(uri: string, displayName?: string): Promise<void> {
  return shareScan(uri, 'Ask AI about this PDF', displayName);
}

async function shareScan(uri: string, dialogTitle: string, displayName?: string): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      toast.error('Sharing is not available on this device');
      return;
    }
    const shareUri = scanShareUri(uri, displayName);
    await runProtected(() =>
      Sharing.shareAsync(shareUri, { mimeType: PDF_MIME, dialogTitle, UTI: 'com.adobe.pdf' }),
    );
  } catch {
    toast.error('Could not share the scan');
  }
}

/**
 * Save the scanned PDF to a user-picked folder via the Storage Access Framework.
 * This is a deliberate export out of the app sandbox (the file leaves Jotji's
 * encrypted store), so we let the user choose exactly where it lands.
 */
export async function savePdfToDevice(
  uri: string,
  fileName = `Scan-${Date.now()}`,
): Promise<void> {
  try {
    const perm = await runProtected(() => SAF.requestDirectoryPermissionsAsync());
    if (!perm.granted) return; // user dismissed the folder picker
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    const destUri = await SAF.createFileAsync(perm.directoryUri, fileName, PDF_MIME);
    await SAF.writeAsStringAsync(destUri, base64, { encoding: 'base64' });
    toast.success('Scan saved to device');
  } catch {
    toast.error('Could not save the scan');
  }
}
