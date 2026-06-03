import React from 'react';
import { Text, type TextProps } from 'react-native';

import type { ColorTokens } from '@core/theme/palettes';
import type { TypeToken } from '@core/theme/tokens';
import { useTheme } from '@core/theme/useTheme';

type AppTextProps = TextProps & {
  variant?: TypeToken;
  color?: keyof ColorTokens;
};

/** Theme-aware text. Picks a resolved type-scale style + a palette color. */
export function AppText({
  variant = 'bodyMd',
  color = 'onSurface',
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return <Text style={[theme.text[variant], { color: theme.colors[color] }, style]} {...rest} />;
}
