import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ShareIntentProvider } from 'expo-share-intent';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';

import { Button } from '@core/components/Button';
import { SheetHost } from '@core/components/Overlay';
import { ToastHost } from '@core/components/Toast';
import { AppText } from '@core/components/Text';
import { useBootstrap } from '@core/bootstrap';
import { ThemeProvider } from '@core/theme/ThemeProvider';
import { useTheme } from '@core/theme/useTheme';
import type { Theme } from '@core/theme/types';
import { useShareTarget } from '@features/share/useShareTarget';
import { AppLockGate } from '@features/profile/components/AppLockGate';
import { RootNavigator } from '@navigation/RootNavigator';
import { navigationRef } from '@navigation/navigationRef';

function buildNavTheme(theme: Theme): NavTheme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.surface,
      card: theme.colors.surfaceContainerLow,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
  };
}

function AppInner() {
  const theme = useTheme();
  const { ready, error, retry } = useBootstrap();
  const [navReady, setNavReady] = useState(false);

  // Process Android share-sheet payloads once the DB and navigator are ready.
  useShareTarget(ready && navReady);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.surface }]}>
        <AppText variant="titleMd" color="onSurface">
          Couldn&apos;t open Jotji
        </AppText>
        <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.errorDetail}>
          {error.message}
        </AppText>
        <Button label="Try again" onPress={retry} style={styles.retryBtn} />
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={buildNavTheme(theme)}
      onReady={() => setNavReady(true)}
    >
      <AppLockGate>
        <RootNavigator />
      </AppLockGate>
      <SheetHost />
      <ToastHost />
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ShareIntentProvider>
      <GestureHandlerRootView style={styles.flex}>
        <KeyboardProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <AppInner />
            </ThemeProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ShareIntentProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  errorDetail: { textAlign: 'center' },
  retryBtn: { marginTop: 16, minWidth: 180 },
});
