/**
 * Centralized Theme Configuration
 * Single source of truth for colors, spacing, typography, etc.
 */

export const theme = {
  colors: {
    // Primary brand colors
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#d1fae5',
    
    // Secondary
    secondary: '#6366f1',
    secondaryHover: '#4f46e5',
    
    // Background & surfaces
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceHover: '#f3f4f6',
    
    // Text
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    
    // Borders
    border: '#e5e7eb',
    borderHover: '#d1d5db',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Semantic colors
    danger: '#dc2626',
    dangerHover: '#b91c1c',
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    s: '0.5rem',     // 8px
    m: '1rem',       // 16px
    l: '1.5rem',     // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },
  
  radius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  
  typography: {
    heading: {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '2rem',
    },
    subheading: {
      fontSize: '1.25rem',
      fontWeight: '600',
      lineHeight: '1.75rem',
    },
    body: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5rem',
    },
    caption: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
    },
    small: {
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
    },
  },
  
  shadows: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    none: 'none',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
};

export default theme;

