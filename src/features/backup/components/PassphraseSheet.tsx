import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { AppText } from '@core/components/Text';
import { TextField } from '@core/components/TextField';

export const MIN_PASSPHRASE = 6;

type PassphraseSheetProps = {
  visible: boolean;
  /** 'create' asks twice + warns; 'enter' is a single field for restore. */
  mode: 'create' | 'enter';
  onClose: () => void;
  onSubmit: (passphrase: string) => void;
};

/**
 * Passphrase entry for encrypting a backup ('create') or opening one ('enter').
 * Rendered in a BottomSheet (never RN Modal). The passphrase is used only to
 * key the archive and is never stored — which also means a forgotten one can't
 * be recovered, so 'create' says so plainly.
 */
export function PassphraseSheet({ visible, mode, onClose, onSubmit }: PassphraseSheetProps) {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (visible) {
      setPass('');
      setConfirm('');
    }
  }, [visible]);

  const creating = mode === 'create';
  const tooShort = pass.length < MIN_PASSPHRASE;
  const mismatch = creating && confirm.length > 0 && pass !== confirm;
  const canSubmit = creating ? !tooShort && pass === confirm : pass.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(pass);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={creating ? 'Set a backup passphrase' : 'Enter backup passphrase'}
    >
      <View style={styles.body}>
        <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.intro}>
          {creating
            ? 'Your backup is encrypted with this passphrase. You’ll need it to restore. Jotji can’t recover it for you — if you forget it, the backup can’t be opened.'
            : 'Enter the passphrase you set when you created this backup.'}
        </AppText>

        <TextField
          label={creating ? 'Passphrase' : 'Backup passphrase'}
          value={pass}
          onChangeText={setPass}
          placeholder={`At least ${MIN_PASSPHRASE} characters`}
          secureTextEntry
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={creating ? 'next' : 'done'}
          onSubmitEditing={creating ? undefined : submit}
        />

        {creating ? (
          <TextField
            label="Confirm passphrase"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter the passphrase"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        ) : null}

        {mismatch ? (
          <AppText variant="labelMd" color="error">
            Passphrases don’t match.
          </AppText>
        ) : null}

        <Button
          label={creating ? 'Create backup' : 'Restore'}
          onPress={submit}
          disabled={!canSubmit}
          style={styles.cta}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingBottom: 8 },
  intro: { lineHeight: 21 },
  cta: { marginTop: 4 },
});
