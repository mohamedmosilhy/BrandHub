import {
  formatCount,
  formatMoney,
  formatPrice,
  formatRelativeTime,
} from './formatters';

describe('presentation formatters', () => {
  it('formats OMR values with exactly three decimals', () => {
    expect(formatPrice(38.9)).toBe('38.900');
    expect(formatPrice(0)).toBe('0.000');
    expect(formatMoney(38.9, 'en')).toBe('OMR 38.900');
    expect(formatMoney(38.9, 'ar')).toBe('38.900 ر.ع.');
  });

  it('formats compact counts like the prototype', () => {
    expect(formatCount(2_400)).toBe('2.4K');
    expect(formatCount(215_000)).toBe('215K');
  });

  it('formats relative time in both languages', () => {
    const now = new Date('2026-09-02T12:00:00Z');
    expect(formatRelativeTime('2026-09-02T10:00:00Z', 'en', now)).toBe(
      '2 hours ago',
    );
    expect(formatRelativeTime('2026-09-01T12:00:00Z', 'ar', now)).toBe('أمس');
  });
});
