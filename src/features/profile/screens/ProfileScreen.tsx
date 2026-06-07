import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BottomSheet } from '@core/components/BottomSheet';
import { Button } from '@core/components/Button';
import { Screen } from '@core/components/Screen';
import { TextField } from '@core/components/TextField';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { deleteSandboxFile, persistImageToSandbox } from '@core/utils/files';
import { newId } from '@core/utils/ids';
import { useResponsive } from '@core/utils/useResponsive';
import { pickFromGallery } from '@features/notes/utils/pickImage';
import { ProfileCard } from '@features/profile/components/ProfileCard';
import { SettingsRow } from '@features/profile/components/SettingsRow';
import { useProfileStore } from '@features/profile/store/profileStore';
import type { RootStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { contentMaxWidth } = useResponsive();
  const { profile, load, setName, setAvatar } = useProfileStore();

  const [nameSheet, setNameSheet] = useState(false);
  const [draftName, setDraftName] = useState('');

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onEditAvatar = async () => {
    try {
      const picked = await pickFromGallery();
      if (!picked) return;
      const { uri } = persistImageToSandbox(picked.uri, `avatar-${newId()}`, picked.mime);
      if (profile.avatarUri) deleteSandboxFile(profile.avatarUri);
      await setAvatar(uri);
    } catch {
      toast.error('Could not update photo');
    }
  };

  const openNameSheet = () => {
    setDraftName(profile.name);
    setNameSheet(true);
  };

  const saveName = async () => {
    setNameSheet(false);
    await setName(draftName.trim());
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth }]}>
        <AppText variant="displaySm" color="onSurface" style={styles.title}>
          Profile
        </AppText>

        <ProfileCard profile={profile} onEditAvatar={onEditAvatar} onEditName={openNameSheet} />

        <View style={styles.rows}>
          <SettingsRow icon="settings" label="Settings" onPress={() => navigation.navigate('Settings')} />
          <SettingsRow icon="heart" label="Support Jotji" onPress={() => navigation.navigate('Support')} />
        </View>

        <AppText variant="bodySm" color="onSurfaceVariant" style={styles.footer}>
          Jotji keeps everything on your device. No account, no cloud.
        </AppText>
      </ScrollView>

      <BottomSheet visible={nameSheet} onClose={() => setNameSheet(false)} title="Your name">
        <View style={styles.nameSheet}>
          <TextField
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Enter your name"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveName}
          />
          <Button label="Save" onPress={saveName} />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 110 },
  title: { marginTop: 8, marginBottom: 16 },
  rows: { marginTop: 24 },
  footer: { textAlign: 'center', marginTop: 24 },
  nameSheet: { gap: 16, paddingBottom: 8 },
});
