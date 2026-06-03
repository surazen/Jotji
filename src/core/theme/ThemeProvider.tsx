/**
 * Theme context. Resolves the active palette (light/dark, system-aware) and
 * builds the per-role text styles from the user's chosen body font + size.
 */
import React, { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@features/profile/store/settingsStore';

import { resolveFont } from './fonts';
import { darkColors, lightColors } from './palettes';
import {
  ambientShadow,
  bubbleRadius,
  fontScales,
  radius,
  softShadow,
  spacing,
  typeScale,
  type TypeStyle,
  type TypeToken,
} from './tokens';
import type { ResolvedTextStyle, Theme } from './types';

export const ThemeContext = createContext<Theme | null>(null);

function buildTheme(dark: boolean, fontFamily: Parameters<typeof resolveFont>[2], scale: number): Theme {
  const colors = dark ? darkColors : lightColors;

  const text = {} as Record<TypeToken, ResolvedTextStyle>;
  (Object.keys(typeScale) as TypeToken[]).forEach((token) => {
    const t: TypeStyle = typeScale[token];
    const font = resolveFont(t.role, t.weight, fontFamily);
    text[token] = {
      ...font,
      fontSize: Math.round(t.size * scale),
      lineHeight: Math.round(t.lineHeight * scale),
      ...(t.letterSpacing !== undefined ? { letterSpacing: t.letterSpacing } : {}),
    };
  });

  return {
    dark,
    colors,
    spacing,
    radius,
    bubbleRadius,
    shadows: { ambient: ambientShadow, soft: softShadow },
    text,
    fontScale: scale,
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const fontScale = useSettingsStore((s) => s.fontScale);

  const dark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const theme = useMemo(
    () => buildTheme(dark, fontFamily, fontScales[fontScale]),
    [dark, fontFamily, fontScale],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
