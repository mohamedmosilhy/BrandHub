import {
  colors,
  fontFamilies,
  lineHeights,
  radius,
  shadows,
  spacing,
} from './tokens';

describe('BRANDHUB theme tokens', () => {
  it('ports the reference palette exactly', () => {
    expect(colors).toMatchObject({
      accent: '#7F77DD',
      accentHover: '#6860CC',
      accentLight: '#EEEDF9',
      pink: '#D4537E',
      gold: '#C8A84B',
      ink: '#1A1A2E',
      background: '#F5F5F7',
      border: '#E8E8EC',
      success: '#22A06B',
      warning: '#E6A817',
      danger: '#D94F4F',
    });
  });

  it('ports every spacing, radius and shadow token', () => {
    expect(Object.values(spacing)).toEqual([
      4, 8, 12, 16, 20, 24, 32, 40, 44, 48, 64, 80,
    ]);
    expect(radius).toMatchObject({
      sm: 6,
      md: 10,
      field: 12,
      control: 14,
      cta: 15,
      lg: 16,
      pill: 16,
      xl: 24,
      full: 9999,
    });
    expect(Object.keys(shadows)).toEqual(['sm', 'md', 'lg', 'card']);
  });

  it('keeps the Arabic face and line height behind single tokens', () => {
    expect(fontFamilies.arabic.regular).toBe('NotoKufiArabic_400Regular');
    expect(lineHeights.arabic).toBe(1.75);
  });
});
