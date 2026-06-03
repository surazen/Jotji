import React from 'react';
import { Feather } from '@expo/vector-icons';

import type { ColorTokens } from '@core/theme/palettes';
import { useTheme } from '@core/theme/useTheme';

export type IconName = keyof typeof Feather.glyphMap;

type IconProps = {
  name: IconName;
  size?: number;
  color?: keyof ColorTokens;
};

/** Thin-line icon (Feather) optically sized for 48dp touch targets. */
export function Icon({ name, size = 22, color = 'onSurface' }: IconProps) {
  const theme = useTheme();
  return <Feather name={name} size={size} color={theme.colors[color]} />;
}
