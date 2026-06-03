/**
 * App bootstrap: load fonts, open the encrypted database, run migrations, and
 * hydrate the settings + profile stores before the UI renders. Returns a status
 * the root <AppGate> uses to gate rendering behind the splash screen.
 */
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';

import { initDatabase } from '@core/db/database';
import { FONT_ASSETS } from '@core/theme/fonts';
import { useProfileStore } from '@features/profile/store/profileStore';
import { useSettingsStore } from '@features/profile/store/settingsStore';

export type BootstrapStatus = {
  ready: boolean;
  error: Error | null;
};

export function useBootstrap(): BootstrapStatus {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDatabase();
        await Promise.all([
          useSettingsStore.getState().hydrate(),
          useProfileStore.getState().load(),
        ]);
        if (!cancelled) setDbReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ready: fontsLoaded && dbReady,
    error: error ?? (fontError ?? null),
  };
}
