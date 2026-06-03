import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@core/theme/useTheme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { AppText } from './Text';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCta?: () => void;
};

/** Centered editorial empty state with optional CTA. */
export function EmptyState({ icon, title, message, ctaLabel, onCta }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon name={icon} size={32} color="onPrimaryContainer" />
      </View>
      <AppText variant="headlineSm" color="onSurface" style={styles.title}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {ctaLabel && onCta ? <Button label={ctaLabel} onPress={onCta} style={styles.cta} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', marginTop: 8 },
  message: { textAlign: 'center' },
  cta: { marginTop: 12 },
});
