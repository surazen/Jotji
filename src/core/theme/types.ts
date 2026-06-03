import type { TextStyle } from 'react-native';

import type { ColorTokens } from './palettes';
import type { radius, spacing, bubbleRadius, TypeToken } from './tokens';

/** A fully-resolved text style (family + weight + scaled size) for a role. */
export type ResolvedTextStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontWeight' | 'fontSize' | 'lineHeight' | 'letterSpacing'
>;

export type Theme = {
  dark: boolean;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  bubbleRadius: typeof bubbleRadius;
  shadows: {
    ambient: object;
    soft: object;
  };
  /** Resolved per-role text styles, already scaled by the user's font size. */
  text: Record<TypeToken, ResolvedTextStyle>;
  /** The numeric font scale currently applied (for ad-hoc sizing). */
  fontScale: number;
};
