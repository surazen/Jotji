/**
 * Font loading + resolution.
 *
 * Manrope is the editorial "anchor" used for all display/headline roles.
 * Body text uses the user's chosen family (System / Inter / Manrope / Serif).
 */
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

import type { FontFamilyKey, TypeRole } from './tokens';

/** Asset map passed to `useFonts`. Keys become the `fontFamily` values. */
export const FONT_ASSETS = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} as const;

type Weight = '400' | '500' | '600' | '700' | '800';

const INTER_BY_WEIGHT: Record<Weight, string> = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_700Bold', // Inter ExtraBold not loaded; fall back to Bold
};

const MANROPE_BY_WEIGHT: Record<Weight, string> = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
};

export type ResolvedFont = {
  /** Registered font family name, or undefined to use the platform default. */
  fontFamily?: string;
  /** Only set when fontFamily is undefined (system/serif rely on weight). */
  fontWeight?: Weight;
};

/**
 * Resolve a concrete font for a type role + weight given the user's body family.
 * Display roles always use Manrope. The system/serif families have no loaded
 * weighted variants, so we fall back to fontWeight on the platform font.
 */
export function resolveFont(
  role: TypeRole,
  weight: Weight,
  bodyFamily: FontFamilyKey,
): ResolvedFont {
  if (role === 'display') {
    return { fontFamily: MANROPE_BY_WEIGHT[weight] };
  }
  switch (bodyFamily) {
    case 'inter':
      return { fontFamily: INTER_BY_WEIGHT[weight] };
    case 'manrope':
      return { fontFamily: MANROPE_BY_WEIGHT[weight] };
    case 'serif':
      // Android resolves the generic 'serif' family natively.
      return { fontFamily: 'serif', fontWeight: weight };
    case 'system':
    default:
      return { fontWeight: weight };
  }
}
