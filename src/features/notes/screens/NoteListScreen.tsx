import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ContextMenu, type ContextAction } from '@core/components/ContextMenu';
import { EmptyState } from '@core/components/EmptyState';
import { Icon } from '@core/components/Icon';
import { Screen } from '@core/components/Screen';
import { NoteCardSkeleton } from '@core/components/Skeleton';
import { AppText } from '@core/components/Text';
import { PressableScale } from '@core/components/PressableScale';
import * as notesRepo from '@core/db/repositories/notesRepo';
import type { NoteWithRelations } from '@core/db/types';
import { greeting } from '@core/utils/dates';
import { useResponsive } from '@core/utils/useResponsive';
import { useTheme } from '@core/theme/useTheme';
import { NotebookPicker } from '@features/notebooks/components/NotebookPicker';
import { useNotesStore } from '@features/notes/store/notesStore';
import type { RootStackParamList } from '@navigation/types';

import { NoteCard } from '../components/NoteCard';
import { shareNoteText } from '../utils/shareNote';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Per-app-launch flag: the greeting shows on the first Home view after the app
// opens, then is consumed so it won't reappear this session. Resets on cold start.
let greetingConsumed = false;

export function NoteListScreen() {
  const navigation = useNavigation<Nav>();
  const { contentMaxWidth } = useResponsive();

  const { notes, pinned, loading, load, togglePin, deleteNote } = useNotesStore();
  const [menuNote, setMenuNote] = useState<NoteWithRelations | null>(null);
  const [moveNote, setMoveNote] = useState<NoteWithRelations | null>(null);
  const [showGreeting, setShowGreeting] = useState(!greetingConsumed);

  useFocusEffect(
    useCallback(() => {
      void load();
      // Leaving Home consumes the greeting so it won't show again this session.
      return () => {
        if (!greetingConsumed) {
          greetingConsumed = true;
          setShowGreeting(false);
        }
      };
    }, [load]),
  );

  const openNote = (id: string) => navigation.navigate('NoteEditor', { noteId: id });

  const menuActions: ContextAction[] = menuNote
    ? [
        {
          icon: 'bookmark',
          label: menuNote.isPinned ? 'Unpin' : 'Pin',
          onPress: () => togglePin(menuNote.id, !menuNote.isPinned),
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
          onPress: () => deleteNote(menuNote.id),
        },
      ]
    : [];

  const showSkeleton = loading && notes.length === 0;

  return (
    <Screen>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.navigate('ScannedFiles')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Scanned files"
          >
            <Icon name="folder" size={24} color="onSurface" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Search')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Icon name="search" size={24} color="onSurface" />
          </Pressable>
        </View>
        <FlashList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ListHeader
              pinned={pinned}
              onOpen={openNote}
              hasNotes={notes.length > 0 || showSkeleton}
              showGreeting={showGreeting}
            />
          }
          ListEmptyComponent={
            showSkeleton ? (
              <View style={styles.skeletons}>
                <NoteCardSkeleton />
                <NoteCardSkeleton />
                <NoteCardSkeleton />
              </View>
            ) : (
              <EmptyState
                icon="feather"
                title="Your archive awaits"
                message="Capture your first thought. Notes you write are saved privately on this device."
                ctaLabel="Write a note"
                onCta={() => navigation.navigate('NoteEditor')}
              />
            )
          }
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => openNote(item.id)}
              onLongPress={() => setMenuNote(item)}
              onMore={() => setMenuNote(item)}
              onTogglePin={() => togglePin(item.id, !item.isPinned)}
              onDelete={() => deleteNote(item.id)}
            />
          )}
        />
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
        onSelect={async (notebookId) => {
          if (moveNote) {
            await notesRepo.moveToNotebook(moveNote.id, notebookId);
            await useNotesStore.getState().reload();
          }
          setMoveNote(null);
        }}
      />
    </Screen>
  );
}

function ListHeader({
  pinned,
  onOpen,
  hasNotes,
  showGreeting,
}: {
  pinned: NoteWithRelations[];
  onOpen: (id: string) => void;
  hasNotes: boolean;
  showGreeting: boolean;
}) {
  const theme = useTheme();
  return (
    <View>
      {showGreeting ? (
        <View style={styles.header}>
          <AppText variant="headlineMd" color="onSurface">
            {greeting()},
          </AppText>
          <AppText variant="bodyLg" color="onSurfaceVariant">
            Your curated thoughts, kept close.
          </AppText>
        </View>
      ) : null}

      {pinned.length > 0 ? (
        <View style={styles.pinnedSection}>
          <AppText variant="labelLg" color="onSurfaceVariant" style={styles.pinnedLabel}>
            Pinned
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinnedRow}>
            {pinned.map((note) => (
              <PressableScale
                key={note.id}
                onPress={() => onOpen(note.id)}
                style={[
                  styles.pinnedCard,
                  { backgroundColor: theme.colors.secondaryContainer, borderRadius: theme.radius.lg },
                ]}
              >
                <Icon name="bookmark" size={14} color="onSecondaryContainer" />
                <AppText variant="titleSm" color="onSecondaryContainer" numberOfLines={2}>
                  {note.title || 'Untitled'}
                </AppText>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {hasNotes && pinned.length > 0 ? (
        <AppText variant="labelLg" color="onSurfaceVariant" style={styles.allLabel}>
          All notes
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  listContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },
  header: { marginTop: 8, marginBottom: 8, gap: 4 },
  pinnedSection: { marginTop: 12, marginBottom: 8 },
  pinnedLabel: { marginBottom: 8 },
  pinnedRow: { gap: 12, paddingRight: 12 },
  pinnedCard: { width: 150, height: 84, padding: 12, justifyContent: 'space-between' },
  allLabel: { marginTop: 16, marginBottom: 12 },
  skeletons: { marginTop: 8 },
});
