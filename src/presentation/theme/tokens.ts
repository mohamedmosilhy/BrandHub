/** Exact React Native port of the approved BRANDHUB `tokens.css`. */
export const colors = {
  accent: '#7F77DD',
  accentHover: '#6860CC',
  accentLight: '#EEEDF9',
  pink: '#D4537E',
  pinkLight: '#FCEEF3',
  gold: '#C8A84B',
  ink: '#1A1A2E',
  ink80: 'rgba(26, 26, 46, 0.80)',
  ink40: 'rgba(26, 26, 46, 0.40)',
  ink10: 'rgba(26, 26, 46, 0.06)',
  white: '#FFFFFF',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FAFAFA',
  border: '#E8E8EC',
  borderStrong: '#D0D0D8',
  textPrimary: '#1A1A2E',
  textSecondary: '#5A5A72',
  textMuted: '#9A9AAF',
  textInverse: '#FFFFFF',
  success: '#22A06B',
  successLight: '#E3F5EF',
  warning: '#E6A817',
  warningLight: '#FEF7E0',
  danger: '#D94F4F',
  dangerLight: '#FDEAEA',
  transparent: 'transparent',
  rating: '#F5B544',
  textSubtleAccessible: '#686879',
  pinkAccessible: '#9D3155',
  successAccessible: '#0F6B45',
  warningAccessible: '#765800',
  dangerAccessible: '#B8323C',
} as const;

export const gradients = {
  brand: {
    colors: [colors.accent, colors.pink] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    css: 'linear-gradient(135deg, #7F77DD 0%, #D4537E 100%)',
  },
  brandSoft: {
    colors: ['rgba(127, 119, 221, 0.12)', 'rgba(212, 83, 126, 0.08)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    css: 'linear-gradient(135deg, rgba(127,119,221,0.12) 0%, rgba(212,83,126,0.08) 100%)',
  },
  heroOverlay: {
    colors: ['transparent', 'rgba(26, 26, 46, 0.75)'] as const,
    locations: [0.4, 1] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    css: 'linear-gradient(180deg, transparent 40%, rgba(26,26,46,0.75) 100%)',
  },
} as const;

export const spacing = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
  x11: 44,
  x12: 48,
  x16: 64,
  x20: 80,
} as const;

export const layout = {
  containerMax: 1280,
  containerPadding: spacing.x6,
  headerHeight: spacing.x16,
  subnavHeight: spacing.x11,
  minimumTouchTarget: spacing.x11,
} as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 } as const;

export const fontFamilies = {
  arabic: {
    regular: 'NotoKufiArabic_400Regular',
    medium: 'NotoKufiArabic_500Medium',
    semibold: 'NotoKufiArabic_600SemiBold',
    bold: 'NotoKufiArabic_700Bold',
  },
  latin: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
} as const;

export const fontSizes = {
  display: 40,
  h1: 32,
  h2: 24,
  h3: 18,
  bodyLg: 16,
  body: 15,
  sm: 13,
  xs: 12,
} as const;

export const lineHeights = { tight: 1.2, normal: 1.55, arabic: 1.75 } as const;
export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
export const iconSizes = { sm: 16, md: 24, lg: 32 } as const;

export const shadows = {
  sm: {
    css: '0 1px 3px rgba(26,26,46,0.08), 0 1px 2px rgba(26,26,46,0.04)',
    boxShadow: '0 1px 3px rgba(26,26,46,0.08), 0 1px 2px rgba(26,26,46,0.04)',
    elevation: 1,
  },
  md: {
    css: '0 4px 12px rgba(26,26,46,0.10), 0 2px 4px rgba(26,26,46,0.06)',
    boxShadow: '0 4px 12px rgba(26,26,46,0.10), 0 2px 4px rgba(26,26,46,0.06)',
    elevation: 4,
  },
  lg: {
    css: '0 8px 24px rgba(26,26,46,0.12), 0 4px 8px rgba(26,26,46,0.06)',
    boxShadow: '0 8px 24px rgba(26,26,46,0.12), 0 4px 8px rgba(26,26,46,0.06)',
    elevation: 8,
  },
  card: {
    css: '0 2px 8px rgba(26,26,46,0.07)',
    boxShadow: '0 2px 8px rgba(26,26,46,0.07)',
    elevation: 2,
  },
} as const;

export const easings = {
  out: [0.16, 1, 0.3, 1],
  in: [0.5, 0, 0.75, 0],
  cssOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  cssIn: 'cubic-bezier(0.5, 0, 0.75, 0)',
} as const;
export const durations = { fast: 150, base: 250, slow: 400 } as const;
export const zIndices = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const;

export const theme = {
  colors,
  gradients,
  spacing,
  layout,
  radius,
  fontFamilies,
  fontSizes,
  lineHeights,
  fontWeights,
  iconSizes,
  shadows,
  easings,
  durations,
  zIndices,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
