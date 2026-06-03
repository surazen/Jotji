import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@core/components/Icon';
import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';

type TagPillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
};

/** Instagram-style hashtag pill. */
export function TagPill({ label, selected = false, onPress, onRemove }: TagPillProps) {
  const theme = useTheme();
  const bg = selected ? theme.colors.primary : theme.colors.primaryContainer;
  const fg = selected ? 'onPrimary' : 'onPrimaryContainer';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, { backgroundColor: bg, borderRadius: theme.radius.full }]}
    >
      <AppText variant="labelMd" color={fg}>
        #{label}
      </AppText>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Icon name="x" size={14} color={fg} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  remove: { marginLeft: 2 },
});

/** Horizontal wrap container for pills. */
export function TagPillRow({ children }: { children: React.ReactNode }) {
  return <View style={rowStyles.row}>{children}</View>;
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
