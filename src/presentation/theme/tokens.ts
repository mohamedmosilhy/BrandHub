/**
 * Design tokens ported from `design-reference/uploads/BRAND HUB (6)/tokens.css`.
 *
 * PHASE 1 STUB. This file carries only the handful of tokens the diagnostics
 * screen needs, so that no other file has to hard-code a colour. Phase 2 replaces
 * it with the complete token set and a typed ThemeProvider.
 *
 * This is the one directory where colour literals are permitted; the lint rule in
 * `eslint.config.js` forbids them everywhere else.
 */
export const colors = {
  accent: '#7F77DD',
  accentLight: '#EEEDF9',
  ink: '#1A1A2E',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  border: '#E8E8EC',
  textSecondary: '#5A5A72',
  textMuted: '#9A9AAF',
  success: '#22A06B',
  warning: '#E6A817',
  danger: '#D94F4F',
} as const;

export const spacing = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
