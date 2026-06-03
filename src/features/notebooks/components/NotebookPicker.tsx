import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Icon } from '@core/components/Icon';
import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';
import { useNotebooksStore } from '@features/notebooks/store/notebooksStore';

type NotebookPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (notebookId: string | null) => void;
  /** Currently-assigned notebook (to show a check). */
  selectedId?: string | null;
};

/** Bottom sheet to move a note into a notebook (or remove it from all). */
export function NotebookPicker({ visible, onClose, onSelect, selectedId }: NotebookPickerProps) {
  const theme = useTheme();
  const { notebooks, load } = useNotebooksStore();

  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  const rows: { id: string | null; name: string; color?: string }[] = [
    { id: null, name: 'No notebook' },
    ...notebooks.map((n) => ({ id: n.id, name: n.name, color: n.color })),
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Move to notebook">
      <ScrollView style={styles.scroll}>
        {rows.map((row) => (
          <Pressable
            key={row.id ?? 'none'}
            onPress={() => {
              onClose();
              onSelect(row.id);
            }}
            android_ripple={{ color: theme.colors.surfaceContainerHigh }}
            style={[styles.row, { borderRadius: theme.radius.md }]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: row.color ?? theme.colors.surfaceContainerHighest },
              ]}
            />
            <AppText variant="bodyLg" style={styles.name}>
              {row.name}
            </AppText>
            {selectedId === row.id ? <Icon name="check" color="primary" /> : null}
          </Pressable>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 360 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  name: { flex: 1 },
});
