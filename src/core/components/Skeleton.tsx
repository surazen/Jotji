import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@core/theme/useTheme';

type SkeletonProps = {
  width?: ViewStyle['width'];
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

/** Shimmering placeholder block. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.colors.surfaceContainerHigh },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** A NoteCard-shaped skeleton row for the list loading state. */
export function NoteCardSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surfaceContainerLowest, ...theme.bubbleRadius },
      ]}
    >
      <Skeleton width="55%" height={18} />
      <Skeleton width="90%" height={12} style={styles.gap} />
      <Skeleton width="75%" height={12} style={styles.gapSm} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 16 },
  gap: { marginTop: 14 },
  gapSm: { marginTop: 8 },
});
