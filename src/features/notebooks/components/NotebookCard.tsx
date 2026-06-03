import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@core/components/PressableScale';
import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';
import type { NotebookWithCount } from '@features/notebooks/types';

type NotebookCardProps = {
  notebook: NotebookWithCount;
  onPress: () => void;
  onLongPress?: () => void;
};

/** Notebook tile: a colored cover band over name + note count. */
export function NotebookCard({ notebook, onPress, onLongPress }: NotebookCardProps) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.radius.lg },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: notebook.color }]} />
      <View style={styles.body}>
        <AppText variant="titleMd" color="onSurface" numberOfLines={2}>
          {notebook.name}
        </AppText>
        <AppText variant="labelMd" color="onSurfaceVariant">
          {notebook.noteCount} {notebook.noteCount === 1 ? 'note' : 'notes'}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, overflow: 'hidden' },
  cover: { height: 64 },
  body: { padding: 12, gap: 4 },
});
