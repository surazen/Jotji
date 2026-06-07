import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ContextMenu, type ContextAction } from '@core/components/ContextMenu';
import { EmptyState } from '@core/components/EmptyState';
import { Icon } from '@core/components/Icon';
import { Screen } from '@core/components/Screen';
import { AppText } from '@core/components/Text';
import { useResponsive } from '@core/utils/useResponsive';
import { useTheme } from '@core/theme/useTheme';
import { useNotebooksStore } from '@features/notebooks/store/notebooksStore';
import type { NotebookWithCount } from '@features/notebooks/types';
import type { RootStackParamList } from '@navigation/types';

import { NotebookCard } from '../components/NotebookCard';
import { NotebookFormSheet } from '../components/NotebookFormSheet';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NotebooksScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { gridColumns, contentMaxWidth } = useResponsive();
  const { notebooks, create, rename, setColor, remove, load } = useNotebooksStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<NotebookWithCount | null>(null);
  const [menuFor, setMenuFor] = useState<NotebookWithCount | null>(null);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const menuActions: ContextAction[] = menuFor
    ? [
        { icon: 'edit-2', label: 'Edit', onPress: () => setEditing(menuFor) },
        {
          icon: 'trash-2',
          label: 'Delete notebook',
          destructive: true,
          onPress: () => remove(menuFor.id),
        },
      ]
    : [];

  return (
    <Screen>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={styles.header}>
          <View>
            <AppText variant="displaySm" color="onSurface">
              Notebooks
            </AppText>
            <AppText variant="bodyLg" color="onSurfaceVariant">
              Organize your archive.
            </AppText>
          </View>
          <Pressable
            onPress={() => setCreateOpen(true)}
            accessibilityLabel="New notebook"
            style={[styles.addBtn, { backgroundColor: theme.colors.primaryContainer }]}
          >
            <Icon name="plus" color="onPrimaryContainer" />
          </Pressable>
        </View>

        <FlashList
          data={notebooks}
          numColumns={gridColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="book"
              title="No notebooks yet"
              message="Group related notes into notebooks to keep things tidy."
              ctaLabel="Create a notebook"
              onCta={() => setCreateOpen(true)}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <NotebookCard
                notebook={item}
                onPress={() =>
                  navigation.navigate('NotebookDetail', { notebookId: item.id, name: item.name })
                }
                onLongPress={() => setMenuFor(item)}
              />
            </View>
          )}
        />
      </View>

      <NotebookFormSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(name, color) => create(name, color)}
      />

      <NotebookFormSheet
        visible={!!editing}
        mode="edit"
        initialName={editing?.name}
        initialColor={editing?.color}
        onClose={() => setEditing(null)}
        onSubmit={async (name, color) => {
          if (editing) {
            await rename(editing.id, name);
            await setColor(editing.id, color);
          }
          setEditing(null);
        }}
      />

      <ContextMenu
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        title={menuFor?.name}
        actions={menuActions}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, width: '100%', alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  addBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 18, paddingBottom: 110 },
  cell: { flex: 1, padding: 6 },
});
