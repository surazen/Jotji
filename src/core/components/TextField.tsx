import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@core/theme/useTheme';

import { AppText } from './Text';

type TextFieldProps = TextInputProps & {
  label?: string;
};

/**
 * Input field per DESIGN.md: surfaceContainerLow background, no bottom line,
 * md radius. On focus the background lifts to surfaceContainerLowest with a
 * 20%-opacity "ghost" primary border.
 */
export function TextField({ label, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="labelMd" color="onSurfaceVariant" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.onSurfaceVariant}
        selectionColor={theme.colors.primary}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          theme.text.bodyLg,
          styles.input,
          {
            color: theme.colors.onSurface,
            borderRadius: theme.radius.md,
            backgroundColor: focused
              ? theme.colors.surfaceContainerLowest
              : theme.colors.surfaceContainerLow,
            borderWidth: 1,
            // "Ghost border": invisible until focus, then primary at 20% opacity.
            borderColor: focused ? withAlpha(theme.colors.primary, 0.2) : 'transparent',
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

/** Append an alpha channel to a #rrggbb hex color. */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 4 },
  input: { paddingHorizontal: 16, paddingVertical: 12 },
});
