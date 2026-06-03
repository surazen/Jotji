import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { Icon } from '@core/components/Icon';
import { TextField } from '@core/components/TextField';

import { DEFAULT_NOTEBOOK_COLOR, NOTEBOOK_COLORS } from './notebookColors';

type NotebookFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
  mode?: 'create' | 'edit';
};

/** Create/rename a notebook and pick a cover color. */
export function NotebookFormSheet({
  visible,
  onClose,
  onSubmit,
  initialName = '',
  initialColor = DEFAULT_NOTEBOOK_COLOR,
  mode = 'create',
}: NotebookFormSheetProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setColor(initialColor);
    }
  }, [visible, initialName, initialColor]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onClose();
    onSubmit(trimmed, color);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={mode === 'create' ? 'New notebook' : 'Edit notebook'}
    >
      <View style={styles.body}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ideas"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        <View style={styles.swatches}>
          {NOTEBOOK_COLORS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} style={[styles.swatch, { backgroundColor: c }]}>
              {color === c ? <Icon name="check" size={16} color="onPrimary" /> : null}
            </Pressable>
          ))}
        </View>

        <Button label={mode === 'create' ? 'Create notebook' : 'Save'} onPress={submit} style={styles.cta} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 18, paddingBottom: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cta: { marginTop: 4 },
});
