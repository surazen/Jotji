import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '@core/components/EmptyState';
import { FAB } from '@core/components/FAB';
import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import * as notesRepo from '@core/db/repositories/notesRepo';
import type { NoteWithRelations } from '@core/db/types';
import { useResponsive } from '@core/utils/useResponsive';
import { NoteCard } from '@features/notes/components/NoteCard';
import type { RootStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NotebookDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'NotebookDetail'>>();
  const navigation = useNavigation<Nav>();
  const { contentMaxWidth } = useResponsive();
  const { notebookId, name } = route.params;

  const [notes, setNotes] = useState<NoteWithRelations[]>([]);

  const reload = useCallback(async () => {
    setNotes(await notesRepo.listNotes({ notebookId }));
  }, [notebookId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, width: '100%', alignSelf: 'center' },
  list: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },
});
