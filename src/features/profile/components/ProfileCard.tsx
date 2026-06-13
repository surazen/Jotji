import React from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@core/components/Icon';
import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';
import type { Profile } from '@core/db/types';

type ProfileCardProps = {
  profile: Profile;
  onEditAvatar: () => void;
  /** Inline name editing — the name field sits high on screen, above the keyboard. */
  editingName: boolean;
  draftName: string;
  onStartEditName: () => void;
  onChangeName: (text: string) => void;
  onCommitName: () => void;
};

/** Account card: avatar + display name (no email/auth — local only). */
export function ProfileCard({
  profile,
  onEditAvatar,
  editingName,
  draftName,
  onStartEditName,
  onChangeName,
  onCommitName,
}: ProfileCardProps) {
  const theme = useTheme();
  const initial = profile.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.radius.xl },
        theme.shadows.soft,
      ]}
    >
      <Pressable onPress={onEditAvatar} style={styles.avatarWrap}>
        {profile.avatarUri ? (
          <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.colors.primaryContainer }]}>
            <AppText variant="headlineMd" color="onPrimaryContainer">
              {initial}
            </AppText>
          </View>
        )}
        <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
          <Icon name="camera" size={13} color="onPrimary" />
        </View>
      </Pressable>

      {editingName ? (
        <TextInput
          value={draftName}
          onChangeText={onChangeName}
          onBlur={onCommitName}
          onSubmitEditing={onCommitName}
          autoFocus
          returnKeyType="done"
          placeholder="Your name"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          selectionColor={theme.colors.primary}
          maxLength={40}
          style={[
            theme.text.headlineSm,
            styles.nameInput,
            { color: theme.colors.onSurface, borderBottomColor: theme.colors.primary },
          ]}
        />
      ) : (
        <Pressable onPress={onStartEditName} style={styles.nameRow}>
          <AppText variant="headlineSm" color="onSurface">
            {profile.name.trim() || 'Add your name'}
          </AppText>
          <Icon name="edit-2" size={15} color="onSurfaceVariant" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', padding: 24, gap: 14 },
  avatarWrap: { width: 88, height: 88 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    textAlign: 'center',
    minWidth: 180,
    paddingVertical: 2,
    borderBottomWidth: 1.5,
  },
});
