import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Icon, type IconName } from '@core/components/Icon';
import { useTheme } from '@core/theme/useTheme';
import { NoteListScreen } from '@features/notes/screens/NoteListScreen';
import { NotebooksScreen } from '@features/notebooks/screens/NotebooksScreen';
import { ProfileScreen } from '@features/profile/screens/ProfileScreen';
import { SearchScreen } from '@features/search/screens/SearchScreen';
import { useStandaloneScan } from '@features/scanner/useStandaloneScan';

import type { AppTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

/** Placeholder for the center "New" tab — never rendered (press is intercepted). */
function NewNotePlaceholder() {
  return <View />;
}

const TAB_ICONS: Record<keyof AppTabParamList, IconName> = {
  Home: 'home',
  Search: 'search',
  New: 'plus',
  Scan: 'maximize',
  Notebooks: 'book',
  Profile: 'user',
};

export function AppTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { startScan, scanSheet } = useStandaloneScan();

  return (
    <>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarShowLabel: false,
        // Glass navigation (DESIGN.md): translucent + blurred, floating over content.
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={24}
              tint={theme.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.glass }]} />
          </View>
        ),
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        tabBarIcon: ({ color, focused }) => {
          const name = TAB_ICONS[route.name as keyof AppTabParamList];
          if (route.name === 'New') {
            return (
              <View
                style={{
                  width: 48,
                  height: 40,
                  borderRadius: 16,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="plus" color="onPrimary" size={24} />
              </View>
            );
          }
          // Feather has no document-scanner glyph; use the Material standard for Scan.
          if (route.name === 'Scan') {
            return <MaterialIcons name="document-scanner" size={focused ? 25 : 23} color={color} />;
          }
          return <Feather name={name} size={focused ? 25 : 23} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={NoteListScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="New"
        component={NewNotePlaceholder}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            rootNav.navigate('NoteEditor');
          },
        }}
      />
      <Tab.Screen
        name="Scan"
        component={NewNotePlaceholder}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            startScan();
          },
        }}
      />
      <Tab.Screen name="Notebooks" component={NotebooksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
    {scanSheet}
    </>
  );
}
