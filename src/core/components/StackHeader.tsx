import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Icon } from './Icon';
import { AppText } from './Text';

type StackHeaderProps = {
  title?: string;
  subtitle?: string;
  /** Right-aligned action node (buttons/icons). */
  right?: ReactNode;
  showBack?: boolean;
};

/** Transparent header with back arrow, centered title, and right actions. */
export function StackHeader({ title, subtitle, right, showBack = true }: StackHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {showBack && navigation.canGoBack() ? (
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.iconBtn}
          >
            <Icon name="arrow-left" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        {subtitle ? (
          <AppText variant="labelMd" color="primary" style={styles.subtitle}>
            {subtitle.toUpperCase()}
          </AppText>
        ) : null}
        {title ? (
          <AppText variant="titleMd" color="onSurface" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  side: { minWidth: 64, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  subtitle: { letterSpacing: 1 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
