import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useTheme } from '@core/theme/useTheme';

import { Icon } from './Icon';
import { AppText } from './Text';

type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  message: string | null;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  show: (message, type = 'info') => set({ message, type }),
  hide: () => set({ message: null }),
}));

/** Convenience helper usable outside React components. */
export const toast = {
  success: (m: string) => useToastStore.getState().show(m, 'success'),
  error: (m: string) => useToastStore.getState().show(m, 'error'),
  info: (m: string) => useToastStore.getState().show(m, 'info'),
};

/** Slim auto-dismissing toast host. Mount once near the navigation root. */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { message, type, hide } = useToastStore();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2500);
    return () => clearTimeout(t);
  }, [message, hide]);

  if (!message) return null;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
  const tint =
    type === 'success' ? 'success' : type === 'error' ? 'error' : ('onSurface' as const);

  return (
    <Animated.View
      entering={SlideInDown}
      exiting={SlideOutDown}
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + 24 }]}
    >
      <View style={[styles.toast, theme.shadows.soft, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
        <Icon name={iconName} color={tint} size={18} />
        <AppText variant="bodyMd" style={styles.text}>
          {message}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  text: { flexShrink: 1 },
});
