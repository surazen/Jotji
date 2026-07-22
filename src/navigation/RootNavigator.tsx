import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SupportScreen } from '@features/donations/screens/SupportScreen';
import { NotebookDetailScreen } from '@features/notebooks/screens/NotebookDetailScreen';
import { NoteEditorScreen } from '@features/notes/screens/NoteEditorScreen';
import { OnboardingScreen } from '@features/onboarding/screens/OnboardingScreen';
import { FaqScreen } from '@features/profile/screens/FaqScreen';
import { SettingsScreen } from '@features/profile/screens/SettingsScreen';
import { useSettingsStore } from '@features/profile/store/settingsStore';
import { SearchScreen } from '@features/search/screens/SearchScreen';
import { ScannedFilesScreen } from '@features/scanner/screens/ScannedFilesScreen';

import { AppTabNavigator } from './AppTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Top-level stack. Screens render their own headers, so the native header is off. */
export function RootNavigator() {
  // Settings are hydrated before this renders (bootstrap gates the UI), so the
  // flag is accurate on first mount: unseen → the walkthrough is the entry screen.
  const onboardingSeen = useSettingsStore((s) => s.onboardingSeen);
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={onboardingSeen ? 'Tabs' : 'Onboarding'}
    >
      <Stack.Screen name="Tabs" component={AppTabNavigator} />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ScannedFiles" component={ScannedFilesScreen} />
      <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
      <Stack.Screen name="NotebookDetail" component={NotebookDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Faq" component={FaqScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}
