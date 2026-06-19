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

/**
 * Notebook tile: a thin colored "spine" on the left (book metaphor) beside the
 * name + note count, with a hairline border and a fixed height so the grid rows
 * stay even. 98% press scale.
 */
export function NotebookCard({ notebook, onPress, onLongPress }: NotebookCardProps) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={[styles.spine, { backgroundColor: notebook.color }]} />
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
  card: { flex: 1, flexDirection: 'row', height: 96, overflow: 'hidden' },
  spine: { width: 6, alignSelf: 'stretch' },
  body: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 4, justifyContent: 'center' },
});
