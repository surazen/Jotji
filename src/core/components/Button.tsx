import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@core/theme/useTheme';

import { PressableScale } from './PressableScale';
import { AppText } from './Text';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

/**
 * Pill button. Primary uses a 135deg primary -> primaryDim "jewel-tone"
 * gradient; secondary uses the secondary container. Both per DESIGN.md.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? 'onPrimary' : 'onSecondaryContainer';

  const inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={theme.colors[textColor]} />
      ) : (
        <AppText variant="labelLg" color={textColor}>
          {label}
        </AppText>
      )}
    </View>
  );

  return (
    <PressableScale
      onPress={disabled || loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[styles.base, { borderRadius: theme.radius.xl, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, { borderRadius: theme.radius.xl }]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.fill,
            { backgroundColor: theme.colors.secondaryContainer, borderRadius: theme.radius.xl },
          ]}
        >
          {inner}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fill: { paddingVertical: 14, paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
