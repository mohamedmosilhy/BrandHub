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

/**
 * `textAlign` that begins at the reading edge. RN has no `start`/`end` for text alignment, but
 * it does not need one: **the platform mirrors `textAlign` itself** whenever the text node's
 * resolved Yoga layout direction is RTL. Both renderers do it, and both were read to confirm it:
 *
 * - iOS — `RCTAttributedTextUtils.mm`: `if (layoutDirection == RightToLeft) { Right → Left;
 *   Left → Right; }`, where `layoutDirection` comes from `YGNodeLayoutGetDirection` in
 *   `ParagraphShadowNode.cpp`.
 * - Android — `TextLayoutManager.kt`: `"right"` resolves to `ALIGN_OPPOSITE`, which for Arabic
 *   script becomes `Gravity.LEFT`; the absent/`"left"` case stays `ALIGN_NORMAL`, which becomes
 *   `Gravity.RIGHT`.
 *
 * So under the RTL layout direction this app sets on its own roots, `'right'` renders on the
 * LEFT — which is exactly the bug an earlier `isRTL ? 'right' : 'left'` produced: every Arabic
 * screen came out left-aligned while its rows mirrored correctly. These values are therefore
 * written **pre-mirror**: `'left'` always means the reading start and `'right'` always the
 * reading end, and the platform resolves which physical edge that is.
 *
 * A run that must stay visually left-to-right whatever the locale — a phone number, a price, an
 * email — does not fight this. It sets `direction: 'ltr'` on its own node, which makes that
 * node's layout direction LTR, disables the mirror for it, and restores `'left'` to meaning the
 * physical left. That is the same thing the prototype does with `direction: ltr` on those spans.
 */
export function textStart(): 'left' | 'right' {
  return 'left';
}

/** `textAlign` that ends at the reading edge — see `textStart` for how it is mirrored. */
export function textEnd(): 'left' | 'right' {
  return 'right';
}

export function writingDirection(isRTL: boolean): Direction {
  return isRTL ? 'rtl' : 'ltr';
}
