import { useContext } from 'react';

import { ThemeContext } from './ThemeProvider';
import type { Theme } from './types';

/** Access the active theme. Must be used within <ThemeProvider>. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within a ThemeProvider.');
  return theme;
}
