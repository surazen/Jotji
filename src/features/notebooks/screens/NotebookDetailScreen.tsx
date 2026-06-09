import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ContextMenu, type ContextAction } from '@core/components/ContextMenu';
import { EmptyState } from '@core/components/EmptyState';
import { FAB } from '@core/components/FAB';
import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import * as notesRepo from '@core/db/repositories/notesRepo';
import type { NoteWithRelations } from '@core/db/types';
import { useResponsive } from '@core/utils/useResponsive';
import { NotebookPicker } from '@features/notebooks/components/NotebookPicker';
import { NoteCard } from '@features/notes/components/NoteCard';
import { shareNoteText } from '@features/notes/utils/shareNote';
import type { RootStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NotebookDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'NotebookDetail'>>();
  const navigation = useNavigation<Nav>();
  const { contentMaxWidth } = useResponsive();
  const { notebookId, name } = route.params;

  const [notes, setNotes] = useState<NoteWithRelations[]>([]);
  const [menuNote, setMenuNote] = useState<NoteWithRelations | null>(null);
  const [moveNote, setMoveNote] = useState<NoteWithRelations | null>(null);

  const reload = useCallback(async () => {
    setNotes(await notesRepo.listNotes({ notebookId }));
  }, [notebookId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const menuActions: ContextAction[] = menuNote
    ? [
        {
          icon: 'edit-3',
          label: 'Edit',
          onPress: () => navigation.navigate('NoteEditor', { noteId: menuNote.id }),
        },
        {
          icon: 'bookmark',
          label: menuNote.isPinned ? 'Unpin' : 'Pin',
          onPress: async () => {
            await notesRepo.setPinned(menuNote.id, !menuNote.isPinned);
            await reload();
          },
        },
        { icon: 'folder', label: 'Move to notebook', onPress: () => setMoveNote(menuNote) },
        {
          icon: 'share-2',
          label: 'Share',
          onPress: () => shareNoteText(menuNote.title, menuNote.bodyPlain),
        },
        {
          icon: 'trash-2',
          label: 'Delete',
          destructive: true,
          onPress: async () => {
            await notesRepo.deleteNote(menuNote.id);
            await reload();
          },
        },
      ]
    : [];

  return (
    <Screen>
      <StackHeader title={name} subtitle="Notebook" />
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <FlashList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title="Empty notebook"
              message="Add a note to this notebook."
              ctaLabel="Write a note"
              onCta={() => navigation.navigate('NoteEditor', { notebookId })}
            />
          }
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
              onLongPress={() => setMenuNote(item)}
              onTogglePin={async () => {
                await notesRepo.setPinned(item.id, !item.isPinned);
                await reload();
              }}
              onDelete={async () => {
                await notesRepo.deleteNote(item.id);
                await reload();
              }}
            />
          )}
        />
      </View>

      <FAB
        actions={[
          {
            icon: 'edit-3',
            label: 'New note',
            onPress: () => navigation.navigate('NoteEditor', { notebookId }),
          },
        ]}
      />

      <ContextMenu
        visible={!!menuNote}
        onClose={() => setMenuNote(null)}
        title={menuNote?.title || 'Note'}
        actions={menuActions}
      />

      <NotebookPicker
        visible={!!moveNote}
        selectedId={moveNote?.notebookId ?? null}
        onClose={() => setMoveNote(null)}
        onSelect={async (targetId) => {
          if (moveNote) {
            await notesRepo.moveToNotebook(moveNote.id, targetId);
            await reload();
          }
          setMoveNote(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, width: '100%', alignSelf: 'center' },
  list: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },
});
