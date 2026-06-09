import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ContextMenu, type ContextAction } from '@core/components/ContextMenu';
import { EmptyState } from '@core/components/EmptyState';
import { Screen } from '@core/components/Screen';
import { AppText } from '@core/components/Text';
import * as notesRepo from '@core/db/repositories/notesRepo';
import type { NoteWithRelations } from '@core/db/types';
import { useResponsive } from '@core/utils/useResponsive';
import { NotebookPicker } from '@features/notebooks/components/NotebookPicker';
import { TagCloud } from '@features/tags/components/TagCloud';
import { useTagsStore } from '@features/tags/store/tagsStore';
import type { TagWithCount } from '@features/tags/types';
import { useNotesStore } from '@features/notes/store/notesStore';
import { shareNoteText } from '@features/notes/utils/shareNote';
import type { RootStackParamList } from '@navigation/types';

import { NoteCard } from '@features/notes/components/NoteCard';
import { SearchBar } from '../components/SearchBar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { contentMaxWidth } = useResponsive();
  const { tags, load: loadTags } = useTagsStore();

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<TagWithCount | null>(null);
  const [results, setResults] = useState<NoteWithRelations[]>([]);
  const [menuNote, setMenuNote] = useState<NoteWithRelations | null>(null);
  const [moveNote, setMoveNote] = useState<NoteWithRelations | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadTags();
    }, [loadTags]),
  );

  // Debounced full-text search.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      if (!activeTag) setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      notesRepo.searchNotes(q).then(setResults);
    }, 180);
    return () => clearTimeout(handle);
  }, [query, activeTag]);

  // Tag filter view (only when not actively text-searching).
  useEffect(() => {
    if (query.trim() || !activeTag) return;
    notesRepo.listNotes({ tagId: activeTag.id }).then(setResults);
  }, [activeTag, query]);

  const onSelectTag = (tag: TagWithCount) => {
    setQuery('');
    setActiveTag((prev) => (prev?.id === tag.id ? null : tag));
  };

  const showingResults = query.trim().length > 0 || activeTag !== null;

  const refreshAfterMutation = async () => {
    if (query.trim()) setResults(await notesRepo.searchNotes(query.trim()));
    else if (activeTag) setResults(await notesRepo.listNotes({ tagId: activeTag.id }));
    await useNotesStore.getState().reload();
  };

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
            await refreshAfterMutation();
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
            await refreshAfterMutation();
          },
        },
      ]
    : [];

  return (
    <Screen>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {!showingResults ? (
          <ScrollView contentContainerStyle={styles.idle}>
            <AppText variant="headlineSm" color="onSurface" style={styles.heading}>
              Discover
            </AppText>
            <TagCloud tags={tags} selectedId={null} onSelect={onSelectTag} />
            {tags.length === 0 ? (
              <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.hint}>
                Tag your notes with #hashtags to filter them here.
              </AppText>
            ) : null}
          </ScrollView>
        ) : results.length === 0 ? (
          <EmptyState icon="search" title="No matches" message="Try a different word or tag." />
        ) : (
          <ScrollView contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled">
            {activeTag ? (
              <AppText variant="labelLg" color="onSurfaceVariant" style={styles.resultsLabel}>
                #{activeTag.name}
              </AppText>
            ) : null}
            {results.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() => navigation.navigate('NoteEditor', { noteId: note.id })}
                onLongPress={() => setMenuNote(note)}
                onMore={() => setMenuNote(note)}
                onTogglePin={async () => {
                  await notesRepo.setPinned(note.id, !note.isPinned);
                  await refreshAfterMutation();
                }}
                onDelete={async () => {
                  await notesRepo.deleteNote(note.id);
                  await refreshAfterMutation();
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

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
            await refreshAfterMutation();
          }
          setMoveNote(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  searchWrap: { paddingTop: 8, paddingBottom: 12 },
  idle: { gap: 16, paddingTop: 8, paddingBottom: 110 },
  heading: { marginBottom: 4 },
  hint: { marginTop: 4 },
  results: { paddingTop: 4, paddingBottom: 110 },
  resultsLabel: { marginBottom: 12 },
});
