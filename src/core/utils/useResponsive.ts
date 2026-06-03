/**
 * Responsive layout helper for phones vs. tablets (Android, incl. tablets).
 * Breakpoint mirrors Android's `sw600dp` "large" qualifier.
 */
import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 600;

export type Responsive = {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  /** Suggested column count for grids (notebooks, etc.). */
  gridColumns: number;
  /** Max content width to keep line lengths comfortable on wide screens. */
  contentMaxWidth: number;
};

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);
  const isTablet = shortestSide >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  return {
    width,
    height,
    isTablet,
    isLandscape,
    gridColumns: isTablet ? 3 : 2,
    contentMaxWidth: isTablet ? 720 : width,
  };
}
