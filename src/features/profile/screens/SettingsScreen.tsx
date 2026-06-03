import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@core/components/Screen';
import { SelectSheet, type SelectOption } from '@core/components/SelectSheet';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { canUseAppLock, authenticate } from '@core/security/appLock';
import {
  FONT_FAMILY_LABELS,
  FONT_SCALE_LABELS,
  fontFamilies,
  type FontFamilyKey,
  type FontScaleKey,
} from '@core/theme/tokens';
import { useResponsive } from '@core/utils/useResponsive';
import { SettingsRow } from '@features/profile/components/SettingsRow';
import { useSettingsStore, type ThemeMode } from '@features/profile/store/settingsStore';

const THEME_OPTIONS: SelectOption<ThemeMode>[] = [
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const FONT_OPTIONS: SelectOption<FontFamilyKey>[] = fontFamilies.map((f) => ({
  value: f,
  label: FONT_FAMILY_LABELS[f],
}));

const SCALE_OPTIONS: SelectOption<FontScaleKey>[] = (
  ['s', 'm', 'l', 'xl'] as FontScaleKey[]
).map((s) => ({ value: s, label: FONT_SCALE_LABELS[s] }));

type Sheet = 'theme' | 'font' | 'scale' | null;

export function SettingsScreen() {
  const { contentMaxWidth } = useResponsive();
  const {
    themeMode,
    fontFamily,
    fontScale,
    appLockEnabled,
    setThemeMode,
    setFontFamily,
    setFontScale,
    setAppLockEnabled,
  } = useSettingsStore();

  const [sheet, setSheet] = useState<Sheet>(null);

  const onToggleAppLock = async (next: boolean) => {
    if (!next) {
      await setAppLockEnabled(false);
      return;
    }
    const available = await canUseAppLock();
    if (!available) {
      toast.error('Set up a screen lock on your device first');
      return;
    }
    const ok = await authenticate('Confirm to enable app lock');
    if (ok) {
      await setAppLockEnabled(true);
      toast.success('App lock enabled');
    }
  };

  return (
    <Screen>
      <StackHeader title="Settings" />
      <ScrollView contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth }]}>
        <Section title="Appearance">
          <SettingsRow
            icon="moon"
            label="Theme"
            value={THEME_OPTIONS.find((o) => o.value === themeMode)?.label}
            onPress={() => setSheet('theme')}
          />
          <SettingsRow
            icon="type"
            label="Font"
            value={FONT_FAMILY_LABELS[fontFamily]}
            onPress={() => setSheet('font')}
          />
          <SettingsRow
            icon="maximize-2"
            label="Text size"
            value={FONT_SCALE_LABELS[fontScale]}
            onPress={() => setSheet('scale')}
          />
        </Section>

        <Section title="Privacy & security">
          <SettingsRow
            icon="lock"
            label="App lock"
            toggle={{ value: appLockEnabled, onValueChange: onToggleAppLock }}
          />
          <AppText variant="bodySm" color="onSurfaceVariant" style={styles.note}>
            Notes are stored in an encrypted database on this device. App lock adds a biometric or
            passcode prompt when you open Jotji.
          </AppText>
        </Section>
      </ScrollView>

      <SelectSheet
        visible={sheet === 'theme'}
        title="Theme"
        options={THEME_OPTIONS}
        selected={themeMode}
        onSelect={setThemeMode}
        onClose={() => setSheet(null)}
      />
      <SelectSheet
        visible={sheet === 'font'}
        title="Font"
        options={FONT_OPTIONS}
        selected={fontFamily}
        onSelect={setFontFamily}
        onClose={() => setSheet(null)}
      />
      <SelectSheet
        visible={sheet === 'scale'}
        title="Text size"
        options={SCALE_OPTIONS}
        selected={fontScale}
        onSelect={setFontScale}
        onClose={() => setSheet(null)}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="labelLg" color="onSurfaceVariant" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 40 },
  section: { marginTop: 20 },
  sectionTitle: { marginBottom: 10, marginLeft: 4 },
  note: { marginTop: 4, marginHorizontal: 4 },
});
