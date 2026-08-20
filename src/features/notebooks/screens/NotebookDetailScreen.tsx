import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ConfirmDialog } from '@core/components/ConfirmDialog';
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
import { SearchBar } from '@features/search/components/SearchBar';
import { shareNoteText, shareNoteToAi } from '@features/notes/utils/shareNote';
import type { RootStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The in-notebook search bar only appears once a notebook is large enough that
// scanning the list becomes tedious; small notebooks stay uncluttered.
const SEARCH_THRESHOLD = 20;

export function NotebookDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'NotebookDetail'>>();
  const navigation = useNavigation<Nav>();
  const { contentMaxWidth } = useResponsive();
  const { notebookId, name } = route.params;

  const [notes, setNotes] = useState<NoteWithRelations[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NoteWithRelations[]>([]);
  const [menuNote, setMenuNote] = useState<NoteWithRelations | null>(null);
  const [moveNote, setMoveNote] = useState<NoteWithRelations | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NoteWithRelations | null>(null);

  const reload = useCallback(async () => {
    // notebookId null = the virtual "General" bucket (notes not in a notebook).
    setNotes(await notesRepo.listNotes(notebookId ? { notebookId } : { unfiled: true }));
  }, [notebookId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  // Live full-text search, scoped to this notebook.
  const trimmed = query.trim();
  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      return;
    }
    let active = true;
    void notesRepo.searchNotes(trimmed, notebookId).then((r) => {
      if (active) setResults(r);
    });
    return () => {
      active = false;
    };
  }, [trimmed, notebookId, notes]);

  const searching = trimmed.length > 0;
  const displayed = searching ? results : notes;
  const showSearch = notes.length > SEARCH_THRESHOLD;

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
          icon: 'zap',
          label: 'Summarize with AI',
          onPress: () => shareNoteToAi(menuNote.title, menuNote.bodyPlain),
        },
        {
          icon: 'trash-2',
          label: 'Delete',
          destructive: true,
          onPress: () => setConfirmDelete(menuNote),
        },
      ]
    : [];

  return (
    <Screen>
      <StackHeader title={name} subtitle="Notebook" />
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        {showSearch ? (
          <View style={styles.searchWrap}>
            <SearchBar value={query} onChangeText={setQuery} placeholder={`Search in ${name}`} />
          </View>
        ) : null}
        <FlashList
          data={displayed}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searching ? (
              <EmptyState
                icon="search"
                title="No matches"
                message={`No notes in ${name} match “${trimmed}”.`}
              />
            ) : (
              <EmptyState
                icon="file-text"
                title="Empty notebook"
                message="Add a note to this notebook."
                ctaLabel="Write a note"
                onCta={() => navigation.navigate('NoteEditor', notebookId ? { notebookId } : undefined)}
              />
            )
          }
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
              onLongPress={() => setMenuNote(item)}
              onMore={() => setMenuNote(item)}
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
            onPress: () => navigation.navigate('NoteEditor', notebookId ? { notebookId } : undefined),
          },
        ]}
      />

      <ContextMenu
        visible={!!menuNote}
        onClose={() => setMenuNote(null)}
        title={menuNote?.title || 'Note'}
        actions={menuActions}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="Delete note?"
        message="This note and its attachments will be permanently deleted. This can’t be undone."
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const n = confirmDelete;
          setConfirmDelete(null);
          if (n) {
            await notesRepo.deleteNote(n.id);
            await reload();
          }
        }}
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
  searchWrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  list: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },
});
