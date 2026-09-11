import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Icon, type IconName } from '@core/components/Icon';
import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';

type SettingsRowProps = {
  icon: IconName;
  label: string;
  /** Right-side value text (for a chevron-style row). */
  value?: string;
  onPress?: () => void;
  /** Render a toggle instead of a chevron/value. */
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
};

/** iOS/Android-style settings row: left icon, label, right control. */
export function SettingsRow({ icon, label, value, onPress, toggle }: SettingsRowProps) {
  const theme = useTheme();
  const content = (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
        <Icon name={icon} size={18} color="onSurface" />
      </View>
      <AppText variant="bodyLg" color="onSurface" style={styles.label}>
        {label}
      </AppText>
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onValueChange}
          trackColor={{ true: theme.colors.primary, false: theme.colors.surfaceContainerHighest }}
          // Contrasting thumb in both themes/states — surfaceContainerLowest is
          // near-black in dark mode and vanishes on the dark "off" track.
          thumbColor={toggle.value ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
        />
      ) : (
        <View style={styles.right}>
          {value ? (
            <AppText variant="bodyMd" color="onSurfaceVariant">
              {value}
            </AppText>
          ) : null}
          {onPress ? <Icon name="chevron-right" size={18} color="onSurfaceVariant" /> : null}
        </View>
      )}
    </View>
  );

  if (toggle || !onPress) {
    return <View style={[styles.surface, { backgroundColor: theme.colors.surfaceContainerLowest }]}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.surfaceContainerHigh }}
      style={[styles.surface, { backgroundColor: theme.colors.surfaceContainerLowest }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
