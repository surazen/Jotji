import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * App-wide navigation ref. Used by code that runs outside the navigator tree
 * (e.g. the Android share-target handler) where `useNavigation` isn't available.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
