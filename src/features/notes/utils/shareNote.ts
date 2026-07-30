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

/**
 * Hand a single note to whatever AI app the user picks from the share sheet
 * (Claude, Gemini, ChatGPT, …). Jotji has no AI of its own — this just fires the
 * same OS share sheet with the note's plain text, prefixed with a summarize
 * instruction so it lands as a ready-to-send prompt. Only the one note the user
 * chose ever leaves the device, and only when they pick a target.
 */
export async function shareNoteToAi(title: string, plain: string): Promise<void> {
  const heading = title.trim();
  const body = plain.trim();
  const note = [heading, body].filter(Boolean).join('\n\n') || 'Untitled note';
  const message = `Summarize the note below in a few clear sentences.\n\n---\n\n${note}`;
  await runProtected(async () => {
    await Share.share({ message, title: 'Summarize with AI' });
  });
}
