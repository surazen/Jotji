import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Icon } from '@core/components/Icon';
import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';

/**
 * Small illustrative snippets for the onboarding cards, rendered from the app's
 * own components/icons rather than bundled screenshots — so they're theme-aware
 * (light/dark), crisp at any size, and mirror what the user actually sees.
 */
export type VisualKind = 'write' | 'organize' | 'toolbar' | 'search' | 'privacy' | 'help';

export function CardVisual({ kind }: { kind: VisualKind }) {
  return <View style={styles.stage}>{renderVisual(kind)}</View>;
}

function renderVisual(kind: VisualKind) {
  switch (kind) {
    case 'write':
      return <FabPlus />;
    case 'organize':
      return <OrganizeChips />;
    case 'toolbar':
      return <ToolbarRow />;
    case 'search':
      return <SearchPill />;
    case 'privacy':
      return <PrivacyChips />;
    case 'help':
      return <HelpRow />;
  }
}

/** The round "+" button that creates a note. */
function FabPlus() {
  const theme = useTheme();
  return (
    <View style={[styles.fab, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.shadow }]}>
      <Icon name="plus" size={34} color="onPrimary" />
    </View>
  );
}

/** A notebook chip + a tag chip. */
function OrganizeChips() {
  const theme = useTheme();
  return (
    <View style={styles.stack}>
      <View style={[styles.notebookChip, { backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: theme.radius.md }]}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        <AppText variant="labelLg" color="onSurface">
          Ideas
        </AppText>
      </View>
      <View style={[styles.tagChip, { backgroundColor: theme.colors.secondaryContainer }]}>
        <AppText variant="labelMd" color="onSecondaryContainer">
          # travel
        </AppText>
      </View>
    </View>
  );
}

/** The editor's attachment toolbar (mirrors AttachmentBar exactly). */
function ToolbarRow() {
  const theme = useTheme();
  const chips: React.ReactNode[] = [
    <Icon key="c" name="camera" size={20} color="onSecondaryContainer" />,
    <Icon key="g" name="image" size={20} color="onSecondaryContainer" />,
    <MaterialIcons key="s" name="document-scanner" size={20} color={theme.colors.onSecondaryContainer} />,
    <Icon key="f" name="paperclip" size={20} color="onSecondaryContainer" />,
    <Icon key="t" name="hash" size={20} color="onSecondaryContainer" />,
  ];
  return (
    <View style={styles.toolbar}>
      {chips.map((c, i) => (
        <View key={i} style={[styles.toolBtn, { backgroundColor: theme.colors.secondaryContainer }]}>
          {c}
        </View>
      ))}
    </View>
  );
}

/** The search field from the top of Home / Notebooks. */
function SearchPill() {
  const theme = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.radius.md }]}>
      <Icon name="search" size={18} color="onSurfaceVariant" />
      <AppText variant="bodyMd" color="onSurfaceVariant">
        Search your notes
      </AppText>
    </View>
  );
}

/** Lock + fingerprint, for the privacy card. */
function PrivacyChips() {
  const theme = useTheme();
  return (
    <View style={styles.privacyRow}>
      <View style={[styles.circle, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon name="lock" size={26} color="onPrimaryContainer" />
      </View>
      <View style={[styles.circle, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialIcons name="fingerprint" size={28} color={theme.colors.onPrimaryContainer} />
      </View>
    </View>
  );
}

/** The Help & FAQ row on the Profile screen. */
function HelpRow() {
  const theme = useTheme();
  return (
    <View style={[styles.helpRow, { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: 14 }]}>
      <View style={[styles.helpIcon, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
        <Icon name="help-circle" size={18} color="onSurface" />
      </View>
      <AppText variant="bodyMd" color="onSurface" style={styles.helpLabel}>
        Help & FAQ
      </AppText>
      <Icon name="chevron-right" size={18} color="onSurfaceVariant" />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  fab: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  stack: { alignItems: 'center', gap: 12 },
  notebookChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  toolbar: { flexDirection: 'row', gap: 10 },
  toolBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, width: 230 },
  privacyRow: { flexDirection: 'row', gap: 16 },
  circle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12, width: 230 },
  helpIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  helpLabel: { flex: 1 },
});
