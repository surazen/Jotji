import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { TextField } from '@core/components/TextField';

type RenameScanSheetProps = {
  visible: boolean;
  /** Current filename including the ".pdf" suffix. */
  filename: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

/** Rename a scan. Edits the base name; the ".pdf" suffix is managed for the user. */
export function RenameScanSheet({ visible, filename, onClose, onSubmit }: RenameScanSheetProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) setName(filename.replace(/\.pdf$/i, ''));
  }, [visible, filename]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onClose();
    onSubmit(trimmed);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Rename scan">
      <View style={styles.body}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Passport"
          autoFocus
          selectTextOnFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Button label="Save" onPress={submit} style={styles.cta} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 18, paddingBottom: 8 },
  cta: { marginTop: 4 },
});
