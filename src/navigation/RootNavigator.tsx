import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SupportScreen } from '@features/donations/screens/SupportScreen';
import { NotebookDetailScreen } from '@features/notebooks/screens/NotebookDetailScreen';
import { NoteEditorScreen } from '@features/notes/screens/NoteEditorScreen';
import { SettingsScreen } from '@features/profile/screens/SettingsScreen';
import { SearchScreen } from '@features/search/screens/SearchScreen';

import { AppTabNavigator } from './AppTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Top-level stack. Screens render their own headers, so the native header is off. */
export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabNavigator} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
      <Stack.Screen name="NotebookDetail" component={NotebookDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}
