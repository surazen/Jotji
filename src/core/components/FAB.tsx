import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@core/theme/useTheme';

import { Icon, type IconName } from './Icon';
import { AppText } from './Text';

export type FabAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

type FabProps = {
  /** When one action: tapping triggers it. When many: tapping toggles a menu. */
  actions: FabAction[];
};

/**
 * Floating action button. Sits bottom-right, intentionally breaking the list
 * container (DESIGN.md), with a multi-layer ambient shadow and a primary
 * gradient. Expands into a spring mini-menu when given multiple actions.
 */
export function FAB({ actions }: FabProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);

  const single = actions.length === 1;

  const toggle = () => {
    if (single) {
      actions[0].onPress();
      return;
    }
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 45 : 0, { duration: 180 });
  };

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <>
      {open ? (
        <Pressable style={styles.backdrop} onPress={toggle} accessibilityLabel="Close menu" />
      ) : null}

      <View style={styles.container} pointerEvents="box-none">
        {open
          ? actions.map((action, i) => (
              <Animated.View
                key={action.label}
                entering={FadeIn.delay(i * 40)}
                exiting={FadeOut}
                style={styles.menuRow}
              >
                <View
                  style={[
                    styles.menuLabel,
                    { backgroundColor: theme.colors.surfaceContainerHighest },
                  ]}
                >
                  <AppText variant="labelMd">{action.label}</AppText>
                </View>
                <Pressable
                  onPress={() => {
                    toggle();
                    action.onPress();
                  }}
                  style={[styles.miniFab, { backgroundColor: theme.colors.secondaryContainer }]}
                >
                  <Icon name={action.icon} color="onSecondaryContainer" />
                </Pressable>
              </Animated.View>
            ))
          : null}

        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel="Create note">
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fab, theme.shadows.ambient]}
          >
            <Animated.View style={iconStyle}>
              <Icon name={single ? actions[0].icon : 'plus'} color="onPrimary" size={26} />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
  container: { position: 'absolute', right: 20, bottom: 24, alignItems: 'flex-end', gap: 14 },
  fab: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  miniFab: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
