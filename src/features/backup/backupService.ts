/**
 * Feature-layer glue for backup/restore: builds the encrypted archive (in
 * core/db) then hands the file to the OS via the Storage Access Framework so
 * the user chooses where it lands (Drive, Downloads, a USB copy), and picks a
 * backup file to restore. No SQL here — that all lives in core/db/backup.
 */
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { readAsStringAsync, StorageAccessFramework as SAF } from 'expo-file-system/legacy';

import { createBackupArchive } from '@core/db/backup';
import { runProtected } from '@core/security/appLockController';

const BACKUP_MIME = 'application/octet-stream';

function backupFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Jotji backup ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.jotjibackup`;
}

/**
 * Build the archive (encrypted only if a passphrase is given) and save it to a
 * user-picked folder. Returns false if the user dismissed the folder picker.
 * The temp archive is always cleaned up. Throws on a build/write failure.
 */
export async function exportBackup(passphrase?: string): Promise<boolean> {
  const { path } = await createBackupArchive(passphrase);
  const uri = path.startsWith('file://') ? path : `file://${path}`;
  try {
    const perm = await runProtected(() => SAF.requestDirectoryPermissionsAsync());
    if (!perm.granted) return false; // folder picker dismissed
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    const destUri = await SAF.createFileAsync(perm.directoryUri, backupFileName(), BACKUP_MIME);
    await SAF.writeAsStringAsync(destUri, base64, { encoding: 'base64' });
    return true;
  } finally {
    try {
      const f = new File(uri);
      if (f.exists) f.delete();
    } catch {
      // Non-fatal — a stray temp file is removed on the next backup.
    }
  }
}

/** Open the document picker for a backup file. Returns its cache URI or null. */
export async function pickBackupFile(): Promise<string | null> {
  const res = await runProtected(() =>
    DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false }),
  );
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}
