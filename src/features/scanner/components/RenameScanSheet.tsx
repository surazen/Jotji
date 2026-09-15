import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { TextField } from '@core/components/TextField';
import { AppText } from '@core/components/Text';

type RenameScanSheetProps = {
  visible: boolean;
  /** Current filename including the ".pdf" suffix. */
  filename: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
  /** Sheet heading (e.g. "Name your scan" when naming right after a capture). */
  title?: string;
  submitLabel?: string;
  /** Small caption above the field, e.g. "Current name" (rename) / "Default name" (capture). */
  currentLabel?: string;
};

/**
 * Rename a scan. Edits the base name; the ".pdf" suffix is managed for the user.
 * The current/default name is shown as a small caption ABOVE an empty field, so
 * the box starts clean (cursor at the start, nothing to select) rather than
 * pre-filled — and an empty submit falls back to the existing name, so pressing
 * the button without typing simply keeps the current name.
 *
 * The parent owns dismissal (via `onSubmit`/`onClose`), so it can chain the next
 * step — e.g. the name-on-capture flow opens the share/save menu afterward.
 */
export function RenameScanSheet({
  visible,
  filename,
  onClose,
  onSubmit,
  title = 'Rename scan',
  submitLabel = 'Save',
  currentLabel = 'Current name',
}: RenameScanSheetProps) {
  const [name, setName] = useState('');
  const base = filename.replace(/\.pdf$/i, '');

  // Start empty each time the sheet opens; the current name lives above the field.
  useEffect(() => {
    if (visible) setName('');
  }, [visible, filename]);

  const submit = () => {
    // Empty input keeps the current/default name rather than doing nothing.
    const finalName = name.trim() || base;
    if (!finalName) return;
    onSubmit(finalName);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.body}>
        {base ? (
          <View style={styles.current}>
            <AppText variant="labelMd" color="onSurfaceVariant">
              {currentLabel}
            </AppText>
            <AppText variant="bodyMd" color="onSurface" numberOfLines={1}>
              {base}
            </AppText>
          </View>
        ) : null}
        <TextField
          label="New name"
          value={name}
          onChangeText={setName}
          placeholder={base || 'e.g. Passport'}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Button label={submitLabel} onPress={submit} style={styles.cta} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingBottom: 8 },
  current: { gap: 2 },
  cta: { marginTop: 4 },
});
