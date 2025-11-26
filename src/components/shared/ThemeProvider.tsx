/**
 * Theme Provider Wrapper
 * Note: This is a placeholder for potential future dark mode support
 * Currently just provides theme object via context
 */

import React, { createContext, useContext } from 'react';
import theme from '../../styles/theme';

const ThemeContext = createContext(theme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

