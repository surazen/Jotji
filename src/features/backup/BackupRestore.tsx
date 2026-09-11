import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { ProgressOverlay } from '@core/components/ProgressOverlay';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { BackupError, restoreBackupArchive, type RestoreSummary } from '@core/db/backup';
import { useTheme } from '@core/theme/useTheme';
import { SettingsRow } from '@features/profile/components/SettingsRow';
import { useNotebooksStore } from '@features/notebooks/store/notebooksStore';
import { useNotesStore } from '@features/notes/store/notesStore';

import { PassphraseSheet } from './components/PassphraseSheet';
import { exportBackup, pickBackupFile } from './backupService';

type Flow = 'options' | 'backup-pass' | 'restore-pass' | null;

function restoreMessage(s: RestoreSummary): string {
  if (s.notes === 0 && s.notebooks === 0 && s.scans === 0 && s.attachments === 0) {
    return 'Everything in that backup was already here';
  }
  const parts: string[] = [];
  if (s.notes) parts.push(`${s.notes} ${s.notes === 1 ? 'note' : 'notes'}`);
  if (s.notebooks) parts.push(`${s.notebooks} ${s.notebooks === 1 ? 'notebook' : 'notebooks'}`);
  if (s.scans) parts.push(`${s.scans} ${s.scans === 1 ? 'scan' : 'scans'}`);
  return `Restored ${parts.join(', ')}`;
}

/**
 * "Back up" / "Restore" rows for Settings → Backup. Backups save one file with
 * everything to Drive or the user's files — the only recovery path, since Jotji
 * has no cloud and an uninstall/reset wipes the on-device data. Encryption is
 * optional (default off, so a forgotten passphrase can't lock anyone out); a
 * passphrase is only needed to restore a file that was encrypted. Restore merges
 * by id, so it never duplicates or overwrites what's already there.
 */
export function BackupRestore() {
  const theme = useTheme();
  const [flow, setFlow] = useState<Flow>(null);
  const [encrypt, setEncrypt] = useState(false);
  const [restoreUri, setRestoreUri] = useState<string | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);

  const doExport = async (passphrase?: string) => {
    setBusy('backup');
    try {
      const saved = await exportBackup(passphrase);
      if (saved) toast.success('Backup saved');
    } catch {
      toast.error('Could not create the backup');
    } finally {
      setBusy(null);
    }
  };

  const onOptionsContinue = () => {
    if (encrypt) {
      setFlow('backup-pass'); // collect a passphrase, then export
    } else {
      setFlow(null);
      void doExport();
    }
  };

  const doRestore = async (uri: string, passphrase?: string) => {
    setBusy('restore');
    try {
      const summary = await restoreBackupArchive(uri, passphrase);
      await useNotesStore.getState().reload();
      await useNotebooksStore.getState().load();
      toast.success(restoreMessage(summary));
      setRestoreUri(null);
    } catch (e) {
      if (e instanceof BackupError && e.code === 'needs-passphrase') {
        setFlow('restore-pass'); // encrypted file — ask, keep the picked uri
      } else {
        setRestoreUri(null);
        toast.error(
          e instanceof BackupError && e.code === 'bad-passphrase'
            ? 'Wrong passphrase, or this isn’t a Jotji backup'
            : 'Could not restore the backup',
        );
      }
    } finally {
      setBusy(null);
    }
  };

  const startRestore = async () => {
    try {
      const uri = await pickBackupFile();
      if (!uri) return;
      setRestoreUri(uri);
      void doRestore(uri); // try unencrypted first; prompts only if needed
    } catch {
      toast.error('Could not open that file');
    }
  };

  return (
    <>
      <SettingsRow icon="save" label="Back up notes" onPress={() => setFlow('options')} />
      <SettingsRow icon="upload" label="Restore from backup" onPress={startRestore} />
      <AppText variant="bodySm" color="onSurfaceVariant" style={styles.note}>
        Save a copy of everything — notes, notebooks, tags, attachments and scans — to Drive or your
        files, so you can restore it after reinstalling or on a new phone.
      </AppText>

      <BottomSheet visible={flow === 'options'} onClose={() => setFlow(null)} title="Back up notes">
        <View style={styles.sheet}>
          <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.intro}>
            This saves one file with all your notes, notebooks, tags, attachments and scans. You choose
            where it goes — Drive, your files, or a computer.
          </AppText>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <AppText variant="bodyLg" color="onSurface">
                Encrypt with a passphrase
              </AppText>
              <AppText variant="bodySm" color="onSurfaceVariant">
                Optional. Protects the file if you keep it somewhere you don’t fully trust. You’ll need
                the passphrase to restore — and it can’t be recovered.
              </AppText>
            </View>
            <Switch
              value={encrypt}
              onValueChange={setEncrypt}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surfaceContainerHighest }}
              // Contrasting thumb in both themes/states — surfaceContainerLowest
              // is near-black in dark mode and vanishes on the dark "off" track.
              thumbColor={encrypt ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
            />
          </View>
          <Button
            label={encrypt ? 'Set passphrase' : 'Back up'}
            onPress={onOptionsContinue}
            style={styles.cta}
          />
        </View>
      </BottomSheet>

      <PassphraseSheet
        visible={flow === 'backup-pass'}
        mode="create"
        onClose={() => setFlow(null)}
        onSubmit={(pass) => {
          setFlow(null);
          void doExport(pass);
        }}
      />
      <PassphraseSheet
        visible={flow === 'restore-pass'}
        mode="enter"
        onClose={() => {
          setFlow(null);
          setRestoreUri(null);
        }}
        onSubmit={(pass) => {
          const uri = restoreUri;
          setFlow(null);
          if (uri) void doRestore(uri, pass);
        }}
      />

      <ProgressOverlay
        visible={busy !== null}
        title={busy === 'backup' ? 'Creating backup…' : 'Restoring…'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 4, marginHorizontal: 4 },
  sheet: { gap: 18, paddingBottom: 8 },
  intro: { lineHeight: 21 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toggleText: { flex: 1, gap: 3 },
  cta: { marginTop: 2 },
});
