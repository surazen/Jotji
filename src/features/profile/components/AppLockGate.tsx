import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View, type AppStateStatus } from 'react-native';

import { Button } from '@core/components/Button';
import { Icon } from '@core/components/Icon';
import { AppText } from '@core/components/Text';
import { authenticate } from '@core/security/appLock';
import { beginProtectedInteraction, isAppLockSuppressed } from '@core/security/appLockController';
import { useTheme } from '@core/theme/useTheme';
import { useSettingsStore } from '@features/profile/store/settingsStore';

/**
 * Gates the app behind a biometric/passcode prompt when app lock is enabled.
 * Locks on cold start and whenever the app returns to the foreground.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const enabled = useSettingsStore((s) => s.appLockEnabled);
  const hydrated = useSettingsStore((s) => s.hydrated);

  const [locked, setLocked] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const tryUnlock = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    const release = beginProtectedInteraction();
    const ok = await authenticate('Unlock Jotji');
    release();
    setAuthenticating(false);
    if (ok) setLocked(false);
  };

  // Once settings are known, unlock immediately if lock is disabled.
  useEffect(() => {
    if (hydrated && !enabled) setLocked(false);
  }, [hydrated, enabled]);

  // Initial prompt on launch when enabled.
  useEffect(() => {
    if (hydrated && enabled && locked) void tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, enabled]);

  // Re-lock when returning to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;
      if (
        enabled &&
        prev.match(/inactive|background/) &&
        next === 'active' &&
        !isAppLockSuppressed()
      ) {
        setLocked(true);
        void tryUnlock();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled || !locked) return <>{children}</>;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon name="lock" size={32} color="onPrimaryContainer" />
      </View>
      <AppText variant="headlineSm" color="onSurface" style={styles.title}>
        Jotji is locked
      </AppText>
      <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.subtitle}>
        Authenticate to access your notes.
      </AppText>
      <Button label="Unlock" onPress={tryUnlock} loading={authenticating} style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  btn: { marginTop: 20, minWidth: 200 },
});
