import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Icon } from '@core/components/Icon';
import { Screen } from '@core/components/Screen';
import { SelectSheet, type SelectOption } from '@core/components/SelectSheet';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { canUseAppLock, authenticate } from '@core/security/appLock';
import { useNotesStore } from '@features/notes/store/notesStore';
import { IMPORT_TOO_LARGE, pickAndImport } from '@features/notes/utils/importNotes';
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

// Evernote only exports .enex from its desktop app, so the steps walk the user
// from their phone's Evernote to a computer and back.
const EVERNOTE_STEPS = [
  'On a Windows or Mac computer, install Evernote and sign in with the same account. Your phone’s notes sync there automatically — no cable needed.',
  'Select the notes you want, or right-click a notebook in the sidebar.',
  'Right-click → Export… (or the ••• menu → Export) and choose the ENEX (.enex) format.',
  'Save the file, then send it to your phone — email it to yourself or upload to Google Drive / Dropbox.',
  'Back here, tap “Import notes” above and pick the .enex file.',
];

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
  const [helpOpen, setHelpOpen] = useState(false);

  const onImport = async () => {
    try {
      const result = await pickAndImport();
      if (!result) return;
      await useNotesStore.getState().reload();
      toast.success(
        result.imported === 1 ? 'Imported 1 note' : `Imported ${result.imported} notes`,
      );
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === IMPORT_TOO_LARGE
          ? 'That file is too large to import (over 50 MB).'
          : 'Could not import that file',
      );
    }
  };

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

        <Section title="Notes & data">
          <SettingsRow icon="download" label="Import notes" onPress={onImport} />
          <AppText variant="bodySm" color="onSurfaceVariant" style={styles.note}>
            Import from an Evernote export (.enex) or a Markdown / text file.
          </AppText>
          <Pressable
            onPress={() => setHelpOpen(true)}
            accessibilityRole="button"
            style={styles.helpLink}
          >
            <Icon name="help-circle" size={15} color="primary" />
            <AppText variant="labelMd" color="primary">
              How to export from Evernote (desktop only)
            </AppText>
          </Pressable>
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

      <BottomSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Export from Evernote"
      >
        <View style={styles.helpBody}>
          <AppText variant="bodyMd" color="onSurfaceVariant">
            Evernote can only create the .enex file from its desktop app (Windows or Mac) — the
            mobile app can’t export it.
          </AppText>
          {EVERNOTE_STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <AppText variant="labelLg" color="primary" style={styles.stepNum}>
                {i + 1}.
              </AppText>
              <AppText variant="bodyMd" color="onSurface" style={styles.stepText}>
                {step}
              </AppText>
            </View>
          ))}
          <AppText variant="bodySm" color="onSurfaceVariant" style={styles.helpFootnote}>
            Markdown (.md) and plain-text (.txt) files import the same way.
          </AppText>
        </View>
      </BottomSheet>
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
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 110 },
  section: { marginTop: 20 },
  sectionTitle: { marginBottom: 10, marginLeft: 4 },
  note: { marginTop: 4, marginHorizontal: 4 },
  helpLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginHorizontal: 4 },
  helpBody: { gap: 14, paddingBottom: 4 },
  step: { flexDirection: 'row', gap: 10 },
  stepNum: { width: 20 },
  stepText: { flex: 1 },
  helpFootnote: { marginTop: 2 },
});
