/** Open a document attachment (PDF/XLS/DOC) in a system viewer via ACTION_VIEW. */
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

import { toast } from '@core/components/Toast';
import { runProtected } from '@core/security/appLockController';
import { fileLabelFromMime } from '@core/utils/files';

export async function openFile(uri: string, mime: string): Promise<void> {
  const label = fileLabelFromMime(mime);
  try {
    // Android forbids handing file:// URIs to other apps; expose the sandboxed
    // file as a content:// URI via the FileProvider so a viewer can read it.
    const contentUri = await getContentUriAsync(uri);
    await runProtected(() =>
      IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: mime,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      }),
    );
  } catch {
    // No app is registered to view this type (ActivityNotFoundException) or the
    // open failed — tell the user to install a suitable reader.
    toast.error(`No app found to open this ${label} file. Please install a ${label} viewer.`);
  }
}
