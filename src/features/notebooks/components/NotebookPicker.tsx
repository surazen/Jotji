import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { Icon } from '@core/components/Icon';
import { TextField } from '@core/components/TextField';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { useTheme } from '@core/theme/useTheme';
import { useNotebooksStore } from '@features/notebooks/store/notebooksStore';

import { DEFAULT_NOTEBOOK_COLOR, NOTEBOOK_COLORS } from './notebookColors';

type NotebookPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (notebookId: string | null) => void;
  /** Currently-assigned notebook (to show a check). */
  selectedId?: string | null;
};

/** Bottom sheet to move a note into a notebook, with inline "new notebook". */
export function NotebookPicker({ visible, onClose, onSelect, selectedId }: NotebookPickerProps) {
  const theme = useTheme();
  const { notebooks, load, create } = useNotebooksStore();

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_NOTEBOOK_COLOR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      void load();
    } else {
      // Reset to the list view whenever the sheet is dismissed.
      setMode('list');
      setName('');
      setColor(DEFAULT_NOTEBOOK_COLOR);
    }
  }, [visible, load]);

  const choose = (id: string | null) => {
    onClose();
    onSelect(id);
  };

  const submitNew = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const created = await create(trimmed, color);
      choose(created.id);
    } catch {
      toast.error('Could not create notebook');
    } finally {
      setSaving(false);
    }
  };

  const rows: { id: string | null; name: string; color?: string }[] = [
    { id: null, name: 'General' },
    ...notebooks.map((n) => ({ id: n.id, name: n.name, color: n.color })),
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={mode === 'create' ? 'New notebook' : 'Move to notebook'}
    >
      {mode === 'create' ? (
        <View style={styles.form}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ideas"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submitNew}
          />
          <View style={styles.swatches}>
            {NOTEBOOK_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }]}
              >
                {color === c ? <Icon name="check" size={16} color="onPrimary" /> : null}
              </Pressable>
            ))}
          </View>
          <Button
            label={saving ? 'Creating…' : 'Create & move here'}
            onPress={submitNew}
            disabled={saving || !name.trim()}
          />
          <Pressable onPress={() => setMode('list')} style={styles.backRow}>
            <Icon name="chevron-left" size={16} color="onSurfaceVariant" />
            <AppText variant="labelMd" color="onSurfaceVariant">
              Back to notebooks
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          <Pressable
            onPress={() => setMode('create')}
            android_ripple={{ color: theme.colors.surfaceContainerHigh }}
            style={[styles.row, { borderRadius: theme.radius.md }]}
          >
            <View style={[styles.dot, styles.addDot, { borderColor: theme.colors.primary }]}>
              <Icon name="plus" size={13} color="primary" />
            </View>
            <AppText variant="bodyLg" color="primary" style={styles.name}>
              New notebook
            </AppText>
          </Pressable>

          {rows.map((row) => (
            <Pressable
              key={row.id ?? 'none'}
              onPress={() => choose(row.id)}
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
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 360 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  addDot: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
  form: { gap: 18, paddingBottom: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', paddingVertical: 4 },
});
