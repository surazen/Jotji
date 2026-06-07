/**
 * Share a note's text to other apps (WhatsApp, Gmail, …) via the OS share sheet.
 *
 * Uses React Native's built-in Share API (plain text), which works without any
 * extra native module. Sharing attachments as files is layered on later with
 * expo-sharing. Wrapped in runProtected so app lock doesn't fire when the share
 * sheet briefly backgrounds the app.
 */
import { Share } from 'react-native';

import { runProtected } from '@core/security/appLockController';

export async function shareNoteText(title: string, plain: string): Promise<void> {
  const heading = title.trim();
  const body = plain.trim();
  const message = [heading, body].filter(Boolean).join('\n\n') || 'Untitled note';
  await runProtected(async () => {
    await Share.share({ message, title: heading || 'Note' });
  });
}
