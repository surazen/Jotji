/**
 * Global app settings (theme mode, body font family, font scale, app lock).
 * Persisted to the encrypted SQLite `app_settings` table; hydrated at bootstrap.
 */
import { create } from 'zustand';

import { getAllSettings, setSetting } from '@core/db/repositories/settingsRepo';
import { fontFamilies, fontScales, type FontFamilyKey, type FontScaleKey } from '@core/theme/tokens';

export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

type SettingsState = {
  hydrated: boolean;
  themeMode: ThemeMode;
  fontFamily: FontFamilyKey;
  fontScale: FontScaleKey;
  appLockEnabled: boolean;
  /** One-time "long-press a link to open it" hint has been shown. */
  linkHintSeen: boolean;

  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setFontFamily: (family: FontFamilyKey) => Promise<void>;
  setFontScale: (scale: FontScaleKey) => Promise<void>;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  markLinkHintSeen: () => Promise<void>;
};

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hydrated: false,
  themeMode: 'system',
  fontFamily: 'inter',
  fontScale: 'm',
  appLockEnabled: false,
  linkHintSeen: false,

  hydrate: async () => {
    const s = await getAllSettings();
    set({
      hydrated: true,
      themeMode: oneOf(s.themeMode, THEME_MODES, 'system'),
      fontFamily: oneOf(s.fontFamily, fontFamilies, 'inter'),
      fontScale: oneOf(s.fontScale, Object.keys(fontScales) as FontScaleKey[], 'm'),
      appLockEnabled: s.appLockEnabled === 'true',
      linkHintSeen: s.linkHintSeen === 'true',
    });
  },

  setThemeMode: async (themeMode) => {
    set({ themeMode });
    await setSetting('themeMode', themeMode);
  },
  setFontFamily: async (fontFamily) => {
    set({ fontFamily });
    await setSetting('fontFamily', fontFamily);
  },
  setFontScale: async (fontScale) => {
    set({ fontScale });
    await setSetting('fontScale', fontScale);
  },
  setAppLockEnabled: async (appLockEnabled) => {
    set({ appLockEnabled });
    await setSetting('appLockEnabled', String(appLockEnabled));
  },
  markLinkHintSeen: async () => {
    set({ linkHintSeen: true });
    await setSetting('linkHintSeen', 'true');
  },
}));
