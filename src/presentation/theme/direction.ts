/**
 * Reading direction, resolved from the active locale rather than from `I18nManager`.
 *
 * `I18nManager.forceRTL` only takes effect after the native host restarts, and in Expo Go it
 * frequently never takes effect at all, so `I18nManager.isRTL` is `false` on an Arabic-first
 * launch. Anything that renders from that flag — text alignment above all — then lays Arabic
 * out left-aligned. Direction here is therefore derived from the locale and applied by the app
 * itself: a `direction` style on the navigation root (Yoga resolves `start`/`end` and mirrors
 * `flexDirection: 'row'` from it) plus an explicit `textAlign` on every `Text`.
 *
 * `I18nManager` is still kept in step at boot so native-owned behaviour — stack transition
 * direction, scroll origin, the platform keyboard — matches on the next cold start. Because a
 * `direction` style is absolute rather than a flip, it stays correct whether or not the native
 * flag has caught up: no double mirroring is possible.
 *
 * This is the one module allowed to name `left` and `right`; see the ESLint override for it.
 */

export type Direction = 'ltr' | 'rtl';

/** Right-to-left scripts this app can plausibly serve. Arabic is the only shipped one. */
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);

export function directionForLocale(locale: string | undefined): Direction {
  const base = (locale ?? '').toLowerCase().split(/[-_]/)[0] ?? '';
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}

export function isRTLLocale(locale: string | undefined): boolean {
  return directionForLocale(locale) === 'rtl';
}

/** `textAlign` that begins at the reading edge. RN has no `start`/`end` for text alignment. */
export function textStart(isRTL: boolean): 'left' | 'right' {
  return isRTL ? 'right' : 'left';
}

/** `textAlign` that ends at the reading edge — prices, counters, trailing meta. */
export function textEnd(isRTL: boolean): 'left' | 'right' {
  return isRTL ? 'left' : 'right';
}

export function writingDirection(isRTL: boolean): Direction {
  return isRTL ? 'rtl' : 'ltr';
}
