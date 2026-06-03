/**
 * Non-color design tokens: spacing, radii, elevation, and the type scale.
 * Base spacing unit is 4px (so `space[8]` = 32px = 2rem, matching DESIGN.md).
 */

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32, // 2rem  — vertical gap between note cards
  10: 40, // 2.5rem — top-level page margin
  12: 48, // 3rem  — generous page margin
  16: 64,
} as const;

export const radius = {
  sm: 6, // bubble "threaded" corner
  md: 12, // 0.75rem — input fields
  lg: 16,
  xl: 24, // 1.5rem — pill buttons, bubble cards
  full: 999,
} as const;

/**
 * Bubble-card asymmetric radii per DESIGN.md: xl on TL/TR/BR, sm on BL.
 * Spread into a style object.
 */
export const bubbleRadius = {
  borderTopLeftRadius: radius.xl,
  borderTopRightRadius: radius.xl,
  borderBottomRightRadius: radius.xl,
  borderBottomLeftRadius: radius.sm,
} as const;

/**
 * Ambient (atmospheric) shadow — soft glow, not a harsh drop shadow.
 * RN/iOS supports a single shadow per view; Android uses `elevation`. For the
 * documented 2-layer effect we approximate with one soft shadow + elevation and
 * (where it matters) a wrapper view. `color` should be `colors.shadow`.
 */
export const ambientShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 8,
} as const;

export const softShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
} as const;

/** Scale applied to all font sizes, chosen by the user in Settings. */
export const fontScales = {
  s: 0.9,
  m: 1.0,
  l: 1.15,
  xl: 1.3,
} as const;
export type FontScaleKey = keyof typeof fontScales;

/** Body font family options the user can pick in Settings. */
export const fontFamilies = ['system', 'inter', 'manrope', 'serif'] as const;
export type FontFamilyKey = (typeof fontFamilies)[number];

export const FONT_FAMILY_LABELS: Record<FontFamilyKey, string> = {
  system: 'System',
  inter: 'Inter',
  manrope: 'Manrope',
  serif: 'Serif',
};

export const FONT_SCALE_LABELS: Record<FontScaleKey, string> = {
  s: 'Small',
  m: 'Medium',
  l: 'Large',
  xl: 'Extra Large',
};

/**
 * Type scale roles. `size`/`lineHeight` are at scale 1.0 and are multiplied by
 * the active font scale at theme-build time. `role` decides which family slot
 * the text uses: 'display' is always the editorial anchor (Manrope); 'body'
 * follows the user's chosen body family.
 */
export type TypeRole = 'display' | 'body';
export type TypeStyle = {
  size: number;
  lineHeight: number;
  weight: '400' | '500' | '600' | '700' | '800';
  role: TypeRole;
  letterSpacing?: number;
};

export const typeScale = {
  displayLg: { size: 56, lineHeight: 60, weight: '800', role: 'display', letterSpacing: -0.5 },
  displaySm: { size: 36, lineHeight: 42, weight: '700', role: 'display', letterSpacing: -0.25 },
  headlineMd: { size: 28, lineHeight: 34, weight: '700', role: 'display' },
  headlineSm: { size: 24, lineHeight: 30, weight: '700', role: 'display' }, // folder titles
  titleLg: { size: 22, lineHeight: 28, weight: '600', role: 'body' },
  titleMd: { size: 18, lineHeight: 24, weight: '600', role: 'body' }, // note previews
  titleSm: { size: 15, lineHeight: 20, weight: '600', role: 'body' },
  bodyLg: { size: 16, lineHeight: 24, weight: '400', role: 'body' },
  bodyMd: { size: 14, lineHeight: 20, weight: '400', role: 'body' },
  bodySm: { size: 12, lineHeight: 16, weight: '400', role: 'body' },
  labelLg: { size: 14, lineHeight: 18, weight: '600', role: 'body' },
  labelMd: { size: 12, lineHeight: 16, weight: '600', role: 'body' },
} satisfies Record<string, TypeStyle>;

export type TypeToken = keyof typeof typeScale;
