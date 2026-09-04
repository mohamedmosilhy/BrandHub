/**
 * BRANDHUB design tokens.
 *
 * Two scales exist in the reference and they are not interchangeable.
 *
 * `design-reference/uploads/BRAND HUB (6)/tokens.css` states in its own header that it is
 * "Storefront only (not dashboard / not app)" and its type scale is explicitly labelled
 * "Fluid type scale (desktop)" — 40/32/24/18/16/15/13/12 px. Porting that scale into a
 * 404 pt-wide phone makes every heading roughly a third too large and every gutter too wide.
 *
 * The mobile scale lives in `design-reference/BRANDHUB App.dc.html`, the customer app
 * prototype. Colour, gradient, shadow, motion and z-index tokens are shared between the two
 * and are ported verbatim; typography, spacing geometry and radii below are read off the app
 * prototype. The desktop scale is retained under `reference` so token parity with `tokens.css`
 * stays verifiable.
 */

export const colors = {
  accent: '#7F77DD',
  accentHover: '#6860CC',
  accentLight: '#EEEDF9',
  pink: '#D4537E',
  pinkLight: '#FCEEF3',
  gold: '#C8A84B',
  /** `#D4C9BD` — the third colour swatch the prototype paints on the product page. */
  sand: '#D4C9BD',
  ink: '#1A1A2E',
  ink80: 'rgba(26, 26, 46, 0.80)',
  ink40: 'rgba(26, 26, 46, 0.40)',
  ink10: 'rgba(26, 26, 46, 0.06)',
  /** The indigo the seller-store cover fades into; `#1A1A2E → #4A4470` in the prototype. */
  inkIndigo: '#4A4470',
  white: '#FFFFFF',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FAFAFA',
  /** Input fill in the app prototype. */
  surfaceField: '#FAFAFE',
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
  /** Onboarding sits on ink; these are the prototype's on-dark values. */
  onDarkPrimary: 'rgba(255, 255, 255, 0.92)',
  onDarkSecondary: 'rgba(255, 255, 255, 0.72)',
  onDarkMuted: 'rgba(255, 255, 255, 0.45)',
  onDarkBorder: 'rgba(255, 255, 255, 0.18)',
  onDarkSurface: 'rgba(255, 255, 255, 0.07)',
  textSubtleAccessible: '#686879',
  pinkAccessible: '#9D3155',
  successAccessible: '#0F6B45',
  warningAccessible: '#765800',
  dangerAccessible: '#B8323C',
} as const;

/**
 * `const TONES` in `design-reference/BRANDHUB App.dc.html`. The prototype rotates these five
 * tints across product images, category tiles and the category hero band; every surface that
 * sits behind a cut-out product photo picks one by index rather than reusing a single tint.
 */
export const tones = [
  colors.accentLight,
  colors.pinkLight,
  colors.successLight,
  colors.warningLight,
  '#E8F1F8',
] as const;

/** The prototype's index-based tone rotation, stable for a given list position. */
export function toneAt(index: number): string {
  return tones[
    ((index % tones.length) + tones.length) % tones.length
  ] as string;
}

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
  /** `linear-gradient(135deg, #1A1A2E 0%, #4A4470 100%)` seller-store cover. */
  sellerCover: {
    colors: [colors.ink, colors.inkIndigo] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    css: 'linear-gradient(135deg, #1A1A2E 0%, #4A4470 100%)',
  },
  /** The app prototype's onboarding hero scrim: .25 → .55 → solid ink. */
  onboardingHero: {
    colors: [
      'rgba(26, 26, 46, 0.25)',
      'rgba(26, 26, 46, 0.55)',
      colors.ink,
    ] as const,
    locations: [0, 0.55, 1] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    css: 'linear-gradient(180deg, rgba(26,26,46,.25) 0%, rgba(26,26,46,.55) 55%, #1A1A2E 100%)',
  },
} as const;

/**
 * The 4 pt scale shared with the storefront. The app prototype also uses 6, 7, 9, 10, 11, 13,
 * 14, 18, 22 and 26 pt steps, which live in `mobile` below rather than being rounded away.
 */
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

/**
 * Geometry read directly off `design-reference/BRANDHUB App.dc.html`. Every value here is a
 * measurement from that prototype, not a derivation.
 */
export const mobile = {
  /** `padding: 12px 16px` / `20px 16px` on every app screen body. */
  screenPaddingX: 16,
  screenPaddingY: 20,
  /** Home is the one screen on an 18 px gutter: `padding: 12px 18px` on every one of its rows. */
  homePaddingX: 18,
  /** `gap` values, most to least common in the prototype. */
  gapSection: 14,
  gapItem: 10,
  gapTight: 7,
  gapRow: 12,
  gapMicro: 4,
  gapHairline: 6,
  onboarding: {
    heroHeight: 384,
    copyInsetStart: 26,
    copyBottom: 34,
    actionPaddingX: 24,
    actionPaddingTop: 26,
    actionPaddingBottom: 34,
  },
  auth: {
    gutter: 22,
    sectionTop: 18,
    headerHeight: 50,
    screenBottom: 28,
    notePaddingX: 13,
  },
  /** `height: 46px` — every text input and the home search pill. */
  fieldHeight: 46,
  /** `height: 50px` primary CTA, `48px` secondary, `38px` compact. */
  buttonHeight: { sm: 38, md: 48, lg: 50 },
  /** `padding: 7px 13px; border-radius: 99px` filter and trending chips. */
  chipHeight: 32,
  chipPaddingX: 13,
  /** `height: 36px` auth mode switch segments inside a `padding: 4px` track. */
  segmentHeight: 36,
  segmentTrackPadding: 4,
  checkboxSize: 18,
  /** `padding: 12px 16px` back-arrow header row. */
  headerHeight: 46,
  /** `padding: 14px` card interiors, `border-radius: 14px`. */
  cardPadding: 14,
  /** `margin: 12px 18px; border-radius: 20px; padding: 18px 20px` home promo banner. */
  promo: {
    radius: 20,
    paddingX: 20,
    paddingY: 18,
    imageSize: 88,
    imageBorder: 5,
    /** The decorative outline ring bled off the banner's leading top corner. */
    ringSize: 150,
    ringInsetStart: -46,
    ringTop: -48,
  },
  /** `padding: 14px 16px 20px` tone band; the artwork tile is `78px`, radius 18. */
  categoryHero: {
    paddingX: 16,
    paddingTop: 14,
    paddingBottom: 20,
    imageSize: 78,
    imageRadius: 18,
    actionSize: 32,
  },
  /** `width: 104px` browse rail; the pane beside it is padded 14. */
  browse: { railWidth: 104, panePadding: 14, headerPaddingX: 18 },
  /** `border-radius: 22px 22px 0 0; padding: 14px 18px 22px` filter sheet. */
  sheet: {
    radius: 22,
    paddingX: 18,
    paddingTop: 14,
    paddingBottom: 22,
    handleWidth: 40,
    handleHeight: 4,
  },
  /** `width: 34px; height: 20px` track with a 16 px knob and 2 px inset. */
  toggle: { trackWidth: 34, trackHeight: 20, knobSize: 16, inset: 2 },
  /** `padding: 3px 9px` status and discount badges. */
  badgePaddingX: 9,
  badgePaddingY: 3,
  /** Circular icon actions: wishlist heart, quantity steppers. */
  iconButtonSize: 34,
  /** `padding: 9px 6px 6px` around five equal columns. */
  tabBar: {
    paddingTop: 9,
    paddingBottom: 6,
    paddingX: 6,
    /** `width: 54px; height: 30px; border-radius: 16px` active pill. */
    pillWidth: 54,
    pillHeight: 30,
    pillRadius: 16,
    iconSize: 22,
    gap: 4,
    /** `min-width: 17px; height: 17px` cart count. */
    badgeSize: 17,
  },
  /**
   * Product detail. `padding: 16px 18px 0` under a full-bleed tone hero; the hero's three
   * circular controls are 36 px with 20 px back and 19 px wishlist/cart glyphs.
   */
  pdp: {
    /** `height: 340px; object-fit: contain` hero image. */
    heroHeight: 340,
    actionSize: 36,
    backIconSize: 20,
    actionIconSize: 19,
    actionInset: 14,
    actionTop: 12,
    bodyPaddingX: 18,
    bodyPaddingTop: 16,
    bodyGap: 12,
    /** `padding: 4px 10px; border-radius: 99px` express and discount pills. */
    badgePaddingX: 10,
    badgePaddingY: 4,
    /** `width: 18px` active pager pill against 5 px dots. */
    dotSize: 5,
    dotActiveWidth: 18,
    dotsBottom: 14,
    /** `width: 34px; height: 34px; border-radius: 99px` colour swatches with a 2/4 px ring. */
    swatchSize: 34,
    swatchRingGap: 2,
    swatchRingWidth: 2,
    /** `width: 38px; height: 38px; border-radius: 10px` seller tile inside a 12 px row. */
    sellerTileSize: 38,
    sellerTileRadius: 10,
    sellerPadding: 12,
    sellerGap: 11,
    /** `padding: 13px; gap: 10px; border-radius: 14px` delivery and returns panel. */
    promisePadding: 13,
    promiseGap: 10,
    promiseIconSize: 17,
    /** `width: 122px; border-radius: 14px` related card — smaller than every catalogue card. */
    relatedWidth: 122,
    relatedRadius: 14,
    relatedGap: 11,
    /** `height: 92px` related card image. */
    relatedImageHeight: 92,
    /** `height: 50px; border-radius: 15px` buy-bar actions in a `12px 16px` bar. */
    buyBarPaddingX: 16,
    buyBarPaddingY: 12,
    buyBarGap: 10,
  },
  /**
   * Seller store. A 148 px gradient cover with the store tile pulled 34 px over it, three stat
   * blocks, then the tab rule and the product grid.
   */
  sellerStore: {
    coverHeight: 148,
    backSize: 34,
    backIconSize: 20,
    backInset: 14,
    /** `width: 68px; border-radius: 18px; border: 3px solid #fff` store tile. */
    tileSize: 68,
    tileRadius: 18,
    tileBorder: 3,
    tileOverlap: -34,
    /** Keep the seller copy below the cover; only the store tile crosses the boundary. */
    identityContentTop: 14,
    identityMinHeight: 56,
    identityGap: 12,
    tileShadow: '0 6px 18px rgba(26,26,46,0.16)',
    paddingX: 18,
    /** `height: 34px; padding: 0 16px; border-radius: 99px` follow action. */
    followHeight: 34,
    followPaddingX: 16,
    /** `border-radius: 14px; padding: 12px` stat blocks in a 10 px row. */
    statRadius: 14,
    statPadding: 12,
    statGap: 10,
    tabGap: 18,
    tabPaddingBottom: 10,
    tabIndicatorWidth: 2.5,
    /** `height: 112px` product image — the catalogue grid's card at a taller crop. */
    productImageHeight: 112,
  },
  /** Wishlist grid: `border-radius: 16px` cells with a 30 px remove heart and a 34 px action. */
  wishlist: {
    cellRadius: 16,
    imageHeight: 118,
    removeSize: 30,
    actionHeight: 34,
    copyPaddingX: 11,
    copyPaddingTop: 9,
    copyPaddingBottom: 12,
  },
  /** Toast floats `bottom: 118px` in the prototype — above the tab bar, not behind it. */
  toastInsetX: 20,
  toastOffset: 22,
  avatarSize: { sm: 28, md: 34, lg: 44 },
} as const;

export const layout = {
  containerMax: 1280,
  containerPadding: mobile.screenPaddingX,
  headerHeight: mobile.headerHeight,
  subnavHeight: spacing.x11,
  /** WCAG 2.2 AA target size. Controls smaller than this widen with `hitSlop`. */
  minimumTouchTarget: spacing.x11,
} as const;

/**
 * `sm`/`md`/`lg`/`xl`/`full` are the storefront radii. `field`, `control`, `cta` and `pill` are
 * the app prototype's 12/14/15/16 px radii, which the storefront scale cannot express.
 */
export const radius = {
  sm: 6,
  md: 10,
  field: 12,
  control: 14,
  cta: 15,
  lg: 16,
  pill: 16,
  /** `border-radius: 18px` — the home deal card, the largest product card in the app. */
  card: 18,
  xl: 24,
  full: 9999,
} as const;

export const fontFamilies = {
  arabic: {
    regular: 'NotoKufiArabic_400Regular',
    medium: 'NotoKufiArabic_500Medium',
    semibold: 'NotoKufiArabic_600SemiBold',
    bold: 'NotoKufiArabic_700Bold',
    extrabold: 'NotoKufiArabic_800ExtraBold',
  },
  latin: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extrabold: 'PlusJakartaSans_800ExtraBold',
  },
} as const;

/**
 * The app prototype's scale. Its four most-used sizes are 11.5, 12.5, 12 and 11 px; headings
 * top out at 26 px for the wordmark and 22 px for a page title.
 */
export const fontSizes = {
  display: 26,
  h1: 22,
  h2: 20,
  /** `font-size: 21px` category-hero title. */
  h2Compact: 21,
  h3: 17,
  /** `font-size: 15.5px; font-weight: 800` — every "Today's deals"-style section heading. */
  section: 15.5,
  bodyLg: 15,
  /** `font-size: 14.5px` home deal price. */
  priceLg: 14.5,
  /** `font-size: 13.5px` search-row price and the primary CTA label. */
  price: 13.5,
  body: 13,
  sm: 12.5,
  xs: 11.5,
  xxs: 10.5,
  micro: 10,
  /** `font-size: 9.5px` — badge pills, the PDP related card and the seller-store stat labels. */
  nano: 9.5,
  /** `font-size: 25px; font-weight: 800` — the PDP price, the largest number in the app. */
  priceHero: 25,
} as const;

/** The desktop storefront scale from `tokens.css`, kept for parity checks. */
export const referenceFontSizes = {
  display: 40,
  h1: 32,
  h2: 24,
  h3: 18,
  bodyLg: 16,
  body: 15,
  sm: 13,
  xs: 12,
} as const;

/**
 * Arabic body copy uses 1.75 (D16). Arabic headings use 1.4: at 20–26 px the body multiplier
 * opens gaps the prototype does not have, while anything under 1.35 clips Noto Kufi descenders.
 */
export const lineHeights = {
  tight: 1.2,
  normal: 1.55,
  arabic: 1.75,
  arabicTight: 1.4,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/** The prototype draws inline SVG at 21–22 px in chrome and 16–17 px inline. */
export const iconSizes = { xs: 14, sm: 17, md: 22, lg: 28 } as const;

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
  tones,
  gradients,
  spacing,
  mobile,
  layout,
  radius,
  fontFamilies,
  fontSizes,
  referenceFontSizes,
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
export type MobileGeometry = typeof mobile;
