import React, { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
 *
 * The panel slides with a manual `translateY` (a shared value + withTiming) and
 * NOT Reanimated's `entering`/`exiting` layout animations: on Android the first
 * layout animation after a cold launch leaves the animated view's touch region
 * unregistered, so the very first sheet opened per launch was visible but
 * tap-dead (the notebook picker "froze"). A plain useAnimatedStyle transform
 * doesn't have that problem.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // `height` is the (negative) keyboard offset: 0 closed, -keyboardHeight open.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  // Stay mounted briefly after closing so the slide-out animation can play.
  const [rendered, setRendered] = useState(visible);
  // 0 = fully closed (slid down), 1 = fully open. Drives the slide + scrim fade.
  const progress = useSharedValue(0);
  // Measured panel height, so the closed state slides fully off-screen.
  const panelHeight = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      progress.value = withTiming(1, { duration: 220 });
      return;
    }
    progress.value = withTiming(0, { duration: 200 });
    const t = setTimeout(() => setRendered(false), 220);
    return () => clearTimeout(t);
  }, [visible, progress]);

  useEffect(() => {
    if (!visible) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => back.remove();
  }, [visible, onClose]);

  const onPanelLayout = (e: LayoutChangeEvent) => {
    panelHeight.value = e.nativeEvent.layout.height;
  };

  // Slide up from below by the panel's own height, and pad above the keyboard
  // (or the bottom inset when it's down).
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * (panelHeight.value || 400) }],
    paddingBottom: Math.max(-keyboardHeight.value, insets.bottom) + 16,
  }));

  // Fade the dim scrim in to ~40% (matches the old `scrim + '66'`).
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.4 }));

  if (!rendered) return null;

  return (
    <Portal>
      <View style={styles.fill} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View style={[styles.scrim, { backgroundColor: theme.colors.scrim }, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <View style={styles.anchor} pointerEvents="box-none">
          <Animated.View
            onLayout={onPanelLayout}
            style={[
              styles.panel,
              {
                backgroundColor: theme.colors.surfaceContainerLow,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
              },
              panelStyle,
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
