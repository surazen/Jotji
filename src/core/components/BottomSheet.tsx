import React, { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@core/theme/useTheme';

import { AppText } from './Text';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Lightweight gesture-free bottom sheet: a slide-up panel over a tappable
 * scrim. Tonal layering (surfaceContainerLow) defines the panel — no borders.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.scrim, { backgroundColor: theme.colors.scrim + '66' }]} onPress={onClose} />
      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[
            styles.panel,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              paddingBottom: insets.bottom + 16,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.colors.surfaceContainerHighest }]} />
          {title ? (
            <AppText variant="titleMd" style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  panel: { paddingHorizontal: 20, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  title: { marginBottom: 14 },
});
