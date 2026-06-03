import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@core/theme/useTheme';

type ScreenProps = {
  children: ReactNode;
  /** Surface level for the page background. Defaults to `surface`. */
  background?: 'surface' | 'surfaceContainerLow';
  edges?: Edge[];
  style?: ViewStyle;
};

/** Full-bleed page container with safe-area insets and a themed background. */
export function Screen({
  children,
  background = 'surface',
  edges = ['top', 'left', 'right'],
  style,
}: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: theme.colors[background] }]}
    >
      <View style={[styles.flex, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
