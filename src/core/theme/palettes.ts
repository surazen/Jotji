/**
 * Color tokens for the "Living Archive" design language.
 *
 * The full Material 3 token set is defined for BOTH light and dark. Hierarchy is
 * built from surface_container tonal layers (NOT borders or shadows) per DESIGN.md:
 *   surface -> surfaceContainerLow -> surfaceContainer -> ... -> surfaceContainerHighest
 *
 * Never use pure black; primary text is `onSurface`.
 */

export type ColorTokens = {
  // Brand
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  /** Darker primary used for the 135deg jewel-tone CTA gradient. */
  primaryDim: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Backgrounds / surfaces (tonal layering)
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Lines (used sparingly; "ghost borders" only)
  outline: string;
  outlineVariant: string;

  // Status
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  /** Pin / amber accent (swipe-to-pin, sync warning dot). */
  pin: string;
  pinContainer: string;
  onPinContainer: string;

  /** Live / success indicator (sync dot). */
  success: string;

  // Misc
  shadow: string;
  scrim: string;
  /** Translucent surface for glass headers (already includes alpha). */
  glass: string;
};

export const lightColors: ColorTokens = {
  primary: '#006666',
  onPrimary: '#ffffff',
  primaryContainer: '#8dedec',
  onPrimaryContainer: '#002020',
  primaryDim: '#004d4d',

  secondary: '#3853b7',
  onSecondary: '#ffffff',
  secondaryContainer: '#c6cfff',
  onSecondaryContainer: '#00174b',

  background: '#f6f6f9',
  onBackground: '#2d2f31',
  surface: '#f6f6f9',
  onSurface: '#2d2f31',
  onSurfaceVariant: '#44474a',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f1f4',
  surfaceContainer: '#eaebee',
  surfaceContainerHigh: '#e7e8eb',
  surfaceContainerHighest: '#dbdde0',

  outline: '#74777b',
  outlineVariant: '#c4c7ca',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',

  pin: '#9a6c00',
  pinContainer: '#ffdf9e',
  onPinContainer: '#2f2000',

  success: '#1f8a4c',

  shadow: '#000000',
  scrim: '#000000',
  glass: 'rgba(246,246,249,0.85)',
};

export const darkColors: ColorTokens = {
  primary: '#70d7d5',
  onPrimary: '#003736',
  primaryContainer: '#00504f',
  onPrimaryContainer: '#8dedec',
  primaryDim: '#4fb3b1',

  secondary: '#bcc6ff',
  onSecondary: '#062978',
  secondaryContainer: '#203a8f',
  onSecondaryContainer: '#dde1ff',

  background: '#111416',
  onBackground: '#e2e2e5',
  surface: '#111416',
  onSurface: '#e2e2e5',
  onSurfaceVariant: '#c4c7ca',
  surfaceContainerLowest: '#0c0f11',
  surfaceContainerLow: '#191c1e',
  surfaceContainer: '#1d2022',
  surfaceContainerHigh: '#272a2c',
  surfaceContainerHighest: '#323537',

  outline: '#8e9194',
  outlineVariant: '#44474a',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  pin: '#f5c344',
  pinContainer: '#5c4400',
  onPinContainer: '#ffdf9e',

  success: '#7bd99a',

  shadow: '#000000',
  scrim: '#000000',
  glass: 'rgba(17,20,22,0.85)',
};
