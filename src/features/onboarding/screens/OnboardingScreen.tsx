import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@core/components/Button';
import { AppText } from '@core/components/Text';
import { useResponsive } from '@core/utils/useResponsive';
import { useTheme } from '@core/theme/useTheme';
import { useSettingsStore } from '@features/profile/store/settingsStore';
import type { RootStackParamList } from '@navigation/types';

import { CardVisual, type VisualKind } from '../components/OnboardingVisuals';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
type Route = RouteProp<RootStackParamList, 'Onboarding'>;

type Card = { visual: VisualKind; title: string; body: string };

// Stable references: React Native requires these not to change between renders.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

const CARDS: Card[] = [
  {
    visual: 'write',
    title: 'Welcome to Jotji',
    body: 'Your private notebook, kept only on this device. Tap the + button any time to start writing.',
  },
  {
    visual: 'organize',
    title: 'Organize your way',
    body: 'File notes into notebooks, and add tags to connect related notes across them. Long-press a note to Move, Pin, or share it.',
  },
  {
    visual: 'toolbar',
    title: 'Capture more than text',
    body: 'While editing a note, use the toolbar to add photos, attach files, or scan a document straight to a PDF.',
  },
  {
    visual: 'search',
    title: 'Find & pin',
    body: 'Tap the magnifier at the top to search across every note. Pin the ones that matter to keep them on top.',
  },
  {
    visual: 'privacy',
    title: 'Private by design',
    body: 'No account, no cloud. Everything is encrypted on your device, and you can lock the app with your fingerprint.',
  },
  {
    visual: 'ai',
    title: 'AI, on your terms',
    body: 'Jotji has no built-in AI, so your notes stay private. From a note’s menu, tap Summarize with AI to hand just that one note to an app you choose — like Claude or Gemini.',
  },
  {
    visual: 'help',
    title: 'You’re all set',
    body: 'Bring notes over from Evernote in Settings, and find answers any time under Profile → Help & FAQ.',
  },
];

/** First-launch walkthrough of Jotji's core features. Skippable; shown once. */
export function OnboardingScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { contentMaxWidth } = useResponsive();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const markOnboardingSeen = useSettingsStore((s) => s.markOnboardingSeen);

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Card>>(null);
  const fromProfile = route.params?.fromProfile ?? false;
  const isLast = index === CARDS.length - 1;

  const finish = useCallback(() => {
    void markOnboardingSeen();
    if (fromProfile) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  }, [fromProfile, navigation, markOnboardingSeen]);

  const next = useCallback(() => {
    if (isLast) finish();
    else listRef.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
  }, [isLast, index, width, finish]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.surface }]} edges={['top', 'bottom', 'left', 'right']}>
      {!isLast ? (
        <Pressable style={styles.skip} onPress={finish} hitSlop={8} accessibilityRole="button">
          <AppText variant="labelLg" color="onSurfaceVariant">
            Skip
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.skip} />
      )}

      <FlatList
        ref={listRef}
        data={CARDS}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.card, { width }]}>
            <CardVisual kind={item.visual} />
            <View style={{ maxWidth: contentMaxWidth }}>
              <AppText variant="headlineMd" color="onSurface" style={styles.title}>
                {item.title}
              </AppText>
              <AppText variant="bodyLg" color="onSurfaceVariant" style={styles.body}>
                {item.body}
              </AppText>
            </View>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {CARDS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === index ? 22 : 8,
                  backgroundColor: theme.colors.primary,
                  opacity: i === index ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>
        <Button label={isLast ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skip: { height: 44, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 24 },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingBottom: 24 },
  title: { textAlign: 'center', marginBottom: 14 },
  body: { textAlign: 'center', lineHeight: 26 },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
});
