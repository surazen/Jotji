/**
 * Standalone scan flow (launched from the Scan tab, not from a note): capture a
 * PDF, then offer Share / Save to device / Attach to a note via a bottom sheet.
 * Returns a `startScan` trigger and the `scanSheet` element to render at the
 * host level. Reuses the same scanDocument() adapter the note editor uses.
 */
import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ContextMenu } from '@core/components/ContextMenu';
import { toast } from '@core/components/Toast';
import * as attachmentsRepo from '@core/db/repositories/attachmentsRepo';
import * as notesRepo from '@core/db/repositories/notesRepo';
import type { RootStackParamList } from '@navigation/types';

import { savePdfToDevice, sharePdf } from './scanActions';
import { scanDocument } from './scanDocument';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useStandaloneScan(): { startScan: () => void; scanSheet: React.ReactNode } {
  const navigation = useNavigation<Nav>();
  const [scanUri, setScanUri] = useState<string | null>(null);

  const startScan = useCallback(async () => {
    const scan = await scanDocument();
    if (scan) setScanUri(scan.pdfUri);
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
    <ContextMenu
      visible={!!scanUri}
      onClose={() => setScanUri(null)}
      title="Scanned document"
      actions={
        scanUri
          ? [
              { icon: 'share-2', label: 'Share', onPress: () => sharePdf(scanUri) },
              { icon: 'download', label: 'Save to device', onPress: () => savePdfToDevice(scanUri) },
              { icon: 'file-plus', label: 'Attach to a note', onPress: () => attachToNote(scanUri) },
            ]
          : []
      }
    />
  );

  return { startScan: () => void startScan(), scanSheet };
}
