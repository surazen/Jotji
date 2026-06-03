import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Icon, type IconName } from '@core/components/Icon';
import { useTheme } from '@core/theme/useTheme';
import { NoteListScreen } from '@features/notes/screens/NoteListScreen';
import { NotebooksScreen } from '@features/notebooks/screens/NotebooksScreen';
import { ProfileScreen } from '@features/profile/screens/ProfileScreen';
import { SearchScreen } from '@features/search/screens/SearchScreen';

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
  Notebooks: 'book',
  Profile: 'user',
};

export function AppTabNavigator() {
  const theme = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderTopWidth: 0,
          height: 64,
          paddingTop: 8,
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
      <Tab.Screen name="Notebooks" component={NotebooksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
