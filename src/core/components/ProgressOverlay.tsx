import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@core/theme/useTheme';

import { Portal } from './Overlay';
import { AppText } from './Text';

type ProgressOverlayProps = {
  visible: boolean;
  title: string;
  /** Optional "done / total" — omit for an indeterminate spinner. */
  done?: number;
  total?: number;
};

/**
 * Blocking, non-dismissible progress card over a dimmed scrim (Portal, no RN
 * Modal). Used for work the user must not interrupt mid-way — e.g. importing a
 * multi-note file. There is intentionally no close affordance.
 */
export function ProgressOverlay({ visible, title, done, total }: ProgressOverlayProps) {
  const theme = useTheme();
  if (!visible) return null;

  const hasCount = typeof done === 'number' && typeof total === 'number' && total > 0;
  return (
    <Portal>
      <View style={[styles.scrim, { backgroundColor: theme.colors.scrim }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: theme.radius.lg }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText variant="titleSm" color="onSurface" style={styles.title}>
            {title}
          </AppText>
          {hasCount ? (
            <AppText variant="bodyMd" color="onSurfaceVariant">
              {done} of {total}
            </AppText>
          ) : null}
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    minWidth: 200,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
  },
  title: { textAlign: 'center' },
});
