/** Open a document attachment (PDF/XLS/DOC) in a system viewer/app. */
import * as Sharing from 'expo-sharing';

import { runProtected } from '@core/security/appLockController';
import { toast } from '@core/components/Toast';

export async function openFile(uri: string, mime: string): Promise<void> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      toast.error('No app available to open this file');
      return;
    }
    await runProtected(() =>
      Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Open with' }),
    );
  } catch {
    toast.error('Could not open the file');
  }
}
