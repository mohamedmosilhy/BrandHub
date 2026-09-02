export type FormattingLocale = 'ar' | 'en';

/** OMR always has three fractional digits; digits stay Latin in both directions. */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(amount);
}

export function formatMoney(amount: number, locale: FormattingLocale): string {
  const price = formatPrice(amount);
  return locale === 'ar' ? `${price} ر.ع.` : `OMR ${price}`;
}

export function formatDate(
  value: Date | string | number,
  locale: FormattingLocale,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-OM', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatCount(value: number): string {
  if (Math.abs(value) < 1_000) return String(value);
  const units = [
    { limit: 1_000_000_000, suffix: 'B' },
    { limit: 1_000_000, suffix: 'M' },
    { limit: 1_000, suffix: 'K' },
  ];
  const unit = units.find((candidate) => Math.abs(value) >= candidate.limit);
  if (!unit) return String(value);
  const compact = value / unit.limit;
  return `${compact.toFixed(compact >= 10 ? 0 : 1).replace(/\.0$/, '')}${unit.suffix}`;
}

export function formatRelativeTime(
  value: Date | string | number,
  locale: FormattingLocale,
  now: Date = new Date(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  const seconds = Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / 1_000),
  );
  if (seconds < 60) return locale === 'ar' ? 'الآن' : 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return locale === 'ar' ? `قبل ${minutes} دقيقة` : `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return locale === 'ar' ? `قبل ${hours} ساعة` : `${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return locale === 'ar' ? 'أمس' : 'Yesterday';
  return locale === 'ar' ? `قبل ${days} أيام` : `${days} days ago`;
}
