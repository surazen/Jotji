import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ContextMenu, type ContextAction } from '@core/components/ContextMenu';
import { EmptyState } from '@core/components/EmptyState';
import { Icon } from '@core/components/Icon';
import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import * as attachmentsRepo from '@core/db/repositories/attachmentsRepo';
import * as notesRepo from '@core/db/repositories/notesRepo';
import * as scannedFilesRepo from '@core/db/repositories/scannedFilesRepo';
import type { ScannedFile } from '@core/db/types';
import { useResponsive } from '@core/utils/useResponsive';
import { useTheme } from '@core/theme/useTheme';
import { NotePicker } from '@features/notes/components/NotePicker';
import { savePdfToDevice, sharePdf } from '@features/scanner/scanActions';
import type { RootStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Device-local library of standalone scans: browse, share, add to a note, save, delete. */
export function ScannedFilesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { contentMaxWidth } = useResponsive();

  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [itemMenu, setItemMenu] = useState<ScannedFile | null>(null);
  // File ids awaiting the New-note/Existing-note choice, then the note picker.
  const [addChoiceFor, setAddChoiceFor] = useState<string[] | null>(null);
  const [notePickerFor, setNotePickerFor] = useState<string[] | null>(null);

  const load = useCallback(() => {
    void scannedFilesRepo.listScannedFiles().then(setFiles);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const exitSelection = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const attachToNote = async (ids: string[], noteId: string) => {
    const byId = new Map(files.map((f) => [f.id, f]));
    for (const id of ids) {
      const f = byId.get(id);
      if (f) {
        await attachmentsRepo.addAttachment({ noteId, sourceUri: f.localUri, mime: 'application/pdf' });
      }
    }
  };

  const addToNewNote = async (ids: string[]) => {
    try {
      const note = await notesRepo.createNote({});
      await attachToNote(ids, note.id);
      exitSelection();
      navigation.navigate('NoteEditor', { noteId: note.id });
    } catch {
      toast.error('Could not add to a note');
    }
  };

  const addToExistingNote = async (ids: string[], noteId: string) => {
    try {
      await attachToNote(ids, noteId);
      exitSelection();
      navigation.navigate('NoteEditor', { noteId });
    } catch {
      toast.error('Could not add to the note');
    }
  };

  const deleteFiles = async (ids: string[]) => {
    await scannedFilesRepo.deleteScannedFiles(ids);
    exitSelection();
    load();
  };

  const itemActions: ContextAction[] = itemMenu
    ? [
        { icon: 'share-2', label: 'Share', onPress: () => sharePdf(itemMenu.localUri) },
        { icon: 'file-plus', label: 'Add to note', onPress: () => setAddChoiceFor([itemMenu.id]) },
        {
          icon: 'download',
          label: 'Save to device',
          onPress: () => savePdfToDevice(itemMenu.localUri, itemMenu.filename.replace(/\.pdf$/i, '')),
        },
        { icon: 'trash-2', label: 'Delete', destructive: true, onPress: () => deleteFiles([itemMenu.id]) },
      ]
    : [];

  const addChoiceActions: ContextAction[] = addChoiceFor
    ? [
        { icon: 'plus', label: 'New note', onPress: () => addToNewNote(addChoiceFor) },
        { icon: 'book-open', label: 'Existing note', onPress: () => setNotePickerFor(addChoiceFor) },
      ]
    : [];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <StackHeader
        title={selectionMode ? `${selected.size} selected` : 'Scanned files'}
        right={
          selectionMode ? (
            <Pressable onPress={exitSelection} hitSlop={8}>
              <AppText variant="labelLg" color="primary">
                Cancel
              </AppText>
            </Pressable>
          ) : files.length > 0 ? (
            <Pressable onPress={() => setSelectionMode(true)} hitSlop={8}>
              <AppText variant="labelLg" color="primary">
                Select
              </AppText>
            </Pressable>
          ) : null
        }
      />

      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        {files.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="No scans yet"
            message="Scans you make from the Scan tab are kept here. Tap one to share it, add it to a note, or save it to your device."
          />
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {files.map((f) => {
              const isSelected = selected.has(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => (selectionMode ? toggle(f.id) : setItemMenu(f))}
                  onLongPress={() => {
                    if (!selectionMode) {
                      setSelectionMode(true);
                      setSelected(new Set([f.id]));
                    }
                  }}
                  android_ripple={{ color: theme.colors.surfaceContainerHigh }}
                  style={[styles.row, { backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.radius.md }]}
                >
                  {selectionMode ? (
                    <Icon name={isSelected ? 'check-circle' : 'circle'} color={isSelected ? 'primary' : 'onSurfaceVariant'} />
                  ) : (
                    <View style={[styles.pdfBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                      <Icon name="file-text" size={20} color="onSecondaryContainer" />
                    </View>
                  )}
                  <View style={styles.rowText}>
                    <AppText variant="bodyLg" numberOfLines={1}>
                      {f.filename}
                    </AppText>
                    {formatSize(f.size) ? (
                      <AppText variant="labelMd" color="onSurfaceVariant">
                        {formatSize(f.size)}
                      </AppText>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {selectionMode && selected.size > 0 ? (
        <View style={[styles.actionBar, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
          <ActionButton icon="file-plus" label="Add to note" onPress={() => setAddChoiceFor([...selected])} />
          <ActionButton
            icon="trash-2"
            label="Delete"
            destructive
            onPress={() => deleteFiles([...selected])}
          />
        </View>
      ) : null}

      <ContextMenu
        visible={!!itemMenu}
        onClose={() => setItemMenu(null)}
        title={itemMenu?.filename}
        actions={itemActions}
      />

      <ContextMenu
        visible={!!addChoiceFor}
        onClose={() => setAddChoiceFor(null)}
        title="Add to note"
        actions={addChoiceActions}
      />

      <NotePicker
        visible={!!notePickerFor}
        onClose={() => setNotePickerFor(null)}
        onSelect={(noteId) => {
          if (notePickerFor) void addToExistingNote(notePickerFor, noteId);
        }}
      />
    </Screen>
  );
}

function ActionButton({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn} hitSlop={8}>
      <Icon name={icon} color={destructive ? 'error' : 'onSurface'} />
      <AppText variant="labelMd" color={destructive ? 'error' : 'onSurface'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, width: '100%', alignSelf: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12 },
  pdfBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 4 },
});
