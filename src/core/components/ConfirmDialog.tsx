import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@core/theme/useTheme';

import { AppText } from './Text';
import { BottomSheet } from './BottomSheet';
import { PressableScale } from './PressableScale';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  /** Optional body explaining the consequence. */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button (default) for irreversible/destructive actions. */
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * A yes/no confirmation presented in a bottom sheet (over a scrim) — the same
 * Portal-based overlay the app uses everywhere instead of RN Modal. Used to
 * guard irreversible actions (deleting a note, deleting a notebook), which is
 * important because Jotji keeps everything on-device with no backup or undo.
 *
 * The parent owns dismissal: `onConfirm` should perform the action AND close
 * (usually by clearing the state that drives `visible`), so we don't clear it
 * here and race the parent's read of that state.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const theme = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.body}>
        {message ? (
          <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.message}>
            {message}
          </AppText>
        ) : null}
        <View style={styles.actions}>
          <PressableScale
            onPress={onClose}
            accessibilityRole="button"
            style={[styles.btn, { backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: theme.radius.xl }]}
          >
            <AppText variant="labelLg" color="onSurface">
              {cancelLabel}
            </AppText>
          </PressableScale>
          <PressableScale
            onPress={onConfirm}
            accessibilityRole="button"
            style={[
              styles.btn,
              { backgroundColor: destructive ? theme.colors.error : theme.colors.primary, borderRadius: theme.radius.xl },
            ]}
          >
            <AppText variant="labelLg" color={destructive ? 'onError' : 'onPrimary'}>
              {confirmLabel}
            </AppText>
          </PressableScale>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 20, paddingBottom: 8 },
  message: { lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' },
});
