import React, { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@core/theme/useTheme';

import { Portal } from './Overlay';
import { AppText } from './Text';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Slide-up panel over a tappable scrim — rendered through a root-level Portal,
 * NOT a React Native <Modal> (see Overlay.tsx for why). Tonal layering
 * (surfaceContainerLow) defines the panel. It lifts above the keyboard using
 * keyboard-controller's animated height (RN's keyboard events don't fire under
 * Android edge-to-edge). Hardware back and scrim taps close it.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // `height` is the (negative) keyboard offset: 0 closed, -keyboardHeight open.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  // Stay mounted briefly after closing so the slide-out animation can play.
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      return;
    }
    const t = setTimeout(() => setRendered(false), 220);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => back.remove();
  }, [visible, onClose]);

  // Pad the panel above the keyboard (or the bottom inset when it's down).
  const panelPadding = useAnimatedStyle(() => ({
    paddingBottom: Math.max(-keyboardHeight.value, insets.bottom) + 16,
  }));

  if (!rendered) return null;

  return (
    <Portal>
      <View style={styles.fill} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable
          style={[styles.scrim, { backgroundColor: theme.colors.scrim + '66', opacity: visible ? 1 : 0 }]}
          onPress={onClose}
        />
        <View style={styles.anchor} pointerEvents="box-none">
          {visible ? (
            <Animated.View
              entering={SlideInDown}
              exiting={SlideOutDown}
              style={[
                styles.panel,
                {
                  backgroundColor: theme.colors.surfaceContainerLow,
                  borderTopLeftRadius: theme.radius.xl,
                  borderTopRightRadius: theme.radius.xl,
                },
                panelPadding,
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
          ) : null}
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  panel: { paddingHorizontal: 20, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  title: { marginBottom: 14 },
});
