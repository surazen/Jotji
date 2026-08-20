/**
 * Standalone scan flow (launched from the Scan tab, not from a note): capture a
 * PDF, let the user name it (or keep the default), then offer Share / Save to
 * device / Attach to a note via a bottom sheet. Returns a `startScan` trigger
 * and the `scanSheet` element to render at the host level. Reuses the same
 * scanDocument() adapter the note editor uses.
 */
import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ContextMenu } from '@core/components/ContextMenu';
import { toast } from '@core/components/Toast';
import * as attachmentsRepo from '@core/db/repositories/attachmentsRepo';
import * as notesRepo from '@core/db/repositories/notesRepo';
import * as scannedFilesRepo from '@core/db/repositories/scannedFilesRepo';
import type { ScannedFile } from '@core/db/types';
import type { RootStackParamList } from '@navigation/types';

import { RenameScanSheet } from './components/RenameScanSheet';
import { savePdfToDevice, sharePdf } from './scanActions';
import { scanDocument } from './scanDocument';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const baseName = (filename: string) => filename.replace(/\.pdf$/i, '');

export function useStandaloneScan(): { startScan: () => void; scanSheet: React.ReactNode } {
  const navigation = useNavigation<Nav>();
  // Two-step flow: name the scan first, then choose an action.
  const [pendingScan, setPendingScan] = useState<ScannedFile | null>(null);
  const [scanFile, setScanFile] = useState<ScannedFile | null>(null);

  const startScan = useCallback(async () => {
    const scan = await scanDocument();
    if (!scan) return;
    try {
      // Every standalone scan is auto-kept in the device-local scan library;
      // naming + the post-scan actions then operate on the saved copy.
      const saved = await scannedFilesRepo.addScannedFile(scan.pdfUri);
      setPendingScan(saved);
    } catch {
      toast.error('Could not save the scan');
    }
  }, []);

  // Close the naming sheet, then present the action menu once it has animated
  // out (avoids two overlapping sheets and lets the keyboard dismiss first).
  const openActions = useCallback((file: ScannedFile) => {
    setPendingScan(null);
    setTimeout(() => setScanFile(file), 260);
  }, []);

  const attachToNote = useCallback(
    async (uri: string) => {
      try {
        const note = await notesRepo.createNote({});
        await attachmentsRepo.addAttachment({ noteId: note.id, sourceUri: uri, mime: 'application/pdf' });
        navigation.navigate('NoteEditor', { noteId: note.id });
      } catch {
        toast.error('Could not create a note from the scan');
      }
    },
    [navigation],
  );

  const scanSheet = (
    <>
      <RenameScanSheet
        visible={!!pendingScan}
        filename={pendingScan?.filename ?? ''}
        title="Name your scan"
        submitLabel="Continue"
        onClose={() => {
          // Dismissing keeps the default name — the scan is never lost.
          if (pendingScan) openActions(pendingScan);
        }}
        onSubmit={(name) => {
          if (!pendingScan) return;
          void scannedFilesRepo.renameScannedFile(pendingScan.id, name);
          openActions({ ...pendingScan, filename: `${name}.pdf` });
        }}
      />

      <ContextMenu
        visible={!!scanFile}
        onClose={() => setScanFile(null)}
        title={scanFile?.filename ?? 'Scanned document'}
        actions={
          scanFile
            ? [
                {
                  icon: 'share-2',
                  label: 'Share',
                  onPress: () => sharePdf(scanFile.localUri, scanFile.filename),
                },
                {
                  icon: 'download',
                  label: 'Save to device',
                  onPress: () => savePdfToDevice(scanFile.localUri, baseName(scanFile.filename)),
                },
                { icon: 'file-plus', label: 'Attach to a note', onPress: () => attachToNote(scanFile.localUri) },
              ]
            : []
        }
      />
    </>
  );

  return { startScan: () => void startScan(), scanSheet };
}
