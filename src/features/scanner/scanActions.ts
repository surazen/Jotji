/**
 * Post-scan actions for a standalone scan (launched from the home FAB, not from
 * a note). Both consume the same cache PDF that {@link scanDocument} produces.
 * "Attach to a note" lives with the caller instead — it needs navigation.
 */
import { readAsStringAsync, StorageAccessFramework as SAF } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { toast } from '@core/components/Toast';
import { runProtected } from '@core/security/appLockController';

const PDF_MIME = 'application/pdf';

/** Share the scanned PDF via the OS share sheet (WhatsApp, Gmail, Drive, …). */
export async function sharePdf(uri: string): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      toast.error('Sharing is not available on this device');
      return;
    }
    await runProtected(() =>
      Sharing.shareAsync(uri, { mimeType: PDF_MIME, dialogTitle: 'Share scan', UTI: 'com.adobe.pdf' }),
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
