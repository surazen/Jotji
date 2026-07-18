import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { Icon } from '@core/components/Icon';
import { ProgressOverlay } from '@core/components/ProgressOverlay';
import { Screen } from '@core/components/Screen';
import { SelectSheet, type SelectOption } from '@core/components/SelectSheet';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { canUseAppLock, authenticate } from '@core/security/appLock';
import { NotebookPicker } from '@features/notebooks/components/NotebookPicker';
import { useNotebooksStore } from '@features/notebooks/store/notebooksStore';
import { useNotesStore } from '@features/notes/store/notesStore';
import {
  IMPORT_TOO_LARGE,
  pickImportFile,
  runImport,
  type ImportResult,
  type ImportTarget,
  type PickedImport,
} from '@features/notes/utils/importNotes';
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
  // A single-note file waiting on the user to choose its notebook.
  const [pendingNote, setPendingNote] = useState<PickedImport | null>(null);
  // A file that was imported before, awaiting the re-import confirmation.
  const [dupWarn, setDupWarn] = useState<PickedImport | null>(null);
  // Live import progress (null = not importing → overlay hidden).
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const finishImport = async (result: ImportResult) => {
    await useNotesStore.getState().reload();
    await useNotebooksStore.getState().load();
    toast.success(result.imported === 1 ? 'Imported 1 note' : `Imported ${result.imported} notes`);
  };

  const importFailed = (e: unknown) => {
    toast.error(
      e instanceof Error && e.message === IMPORT_TOO_LARGE
        ? 'That file is too large to import (over 50 MB).'
        : 'Could not import that file',
    );
  };

  // Actually write the notes, showing the blocking progress overlay throughout.
  const doRun = async (picked: PickedImport, target: ImportTarget) => {
    setProgress({ done: 0, total: picked.noteCount });
    try {
      const result = await runImport(picked, target, (done, total) => setProgress({ done, total }));
      await finishImport(result);
    } catch (e) {
      importFailed(e);
    } finally {
      setProgress(null);
    }
  };

  // A multi-note export is a notebook: recreate it under the file's name.
  // A single note has no notebook of its own, so let the user place it.
  const proceed = (picked: PickedImport) => {
    if (picked.noteCount > 1) {
      void doRun(picked, { mode: 'new-notebook', name: picked.suggestedNotebookName });
    } else {
      setPendingNote(picked);
    }
  };

  const onImport = async () => {
    try {
      const picked = await pickImportFile();
      if (!picked) return;
      if (picked.priorImport) setDupWarn(picked);
      else proceed(picked);
    } catch (e) {
      importFailed(e);
    }
  };

  const onPickNotebook = (notebookId: string | null) => {
    const picked = pendingNote;
    setPendingNote(null);
    if (picked) void doRun(picked, { mode: 'existing', notebookId });
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

      <NotebookPicker
        visible={!!pendingNote}
        title="Add imported note to"
        onClose={() => setPendingNote(null)}
        onSelect={onPickNotebook}
      />

      <BottomSheet visible={!!dupWarn} onClose={() => setDupWarn(null)} title="Already imported">
        {dupWarn ? (
          <View style={styles.dupBody}>
            <AppText variant="bodyMd" color="onSurfaceVariant">
              You imported this file on {formatDate(dupWarn.priorImport!.importedAt)} (
              {dupWarn.priorImport!.noteCount === 1
                ? '1 note'
                : `${dupWarn.priorImport!.noteCount} notes`}
              ). Importing it again creates a second copy and uses about{' '}
              {formatSize(dupWarn.byteSize)} more storage.
            </AppText>
            <Button
              label="Import anyway"
              onPress={() => {
                const picked = dupWarn;
                setDupWarn(null);
                proceed(picked);
              }}
              style={styles.dupCta}
            />
            <Pressable onPress={() => setDupWarn(null)} style={styles.dupCancel} hitSlop={8}>
              <AppText variant="labelLg" color="primary">
                Cancel
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </BottomSheet>

      <ProgressOverlay
        visible={progress !== null}
        title="Importing notes…"
        done={progress?.done}
        total={progress?.total}
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

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
  dupBody: { gap: 16, paddingBottom: 4 },
  dupCta: { marginTop: 2 },
  dupCancel: { alignSelf: 'center', paddingVertical: 4 },
});
