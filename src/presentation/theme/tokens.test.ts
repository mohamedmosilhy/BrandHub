import {
  colors,
  fontFamilies,
  fontSizes,
  lineHeights,
  mobile,
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

  /**
   * These are measurements, not preferences: each one appears as a literal in the product,
   * seller-store and wishlist blocks of `design-reference/BRANDHUB App.dc.html`. Pinning them
   * here is what stops the three Phase 7 screens drifting back off the reference.
   */
  it('pins the product-detail geometry to the prototype', () => {
    expect(mobile.pdp).toMatchObject({
      // `height: 340px; object-fit: contain` hero image.
      heroHeight: 340,
      // `width: 36px; height: 36px` controls with 20 px back and 19 px wishlist/cart glyphs.
      actionSize: 36,
      backIconSize: 20,
      actionIconSize: 19,
      actionInset: 14,
      actionTop: 12,
      // `padding: 16px 18px 0; gap: 12px`.
      bodyPaddingX: 18,
      bodyPaddingTop: 16,
      bodyGap: 12,
      // `padding: 4px 10px` pills; an 18x5 active pager pill against 5 px dots.
      badgePaddingX: 10,
      badgePaddingY: 4,
      dotSize: 5,
      dotActiveWidth: 18,
      dotsBottom: 14,
      // `width: 34px` colour swatches; a 38 px radius-10 seller tile in a 12 px row.
      swatchSize: 34,
      sellerTileSize: 38,
      sellerTileRadius: 10,
      sellerPadding: 12,
      sellerGap: 11,
      // `padding: 13px; gap: 10px` promise panel with 17 px glyphs.
      promisePadding: 13,
      promiseGap: 10,
      promiseIconSize: 17,
      // `width: 122px; border-radius: 14px` related card in an 11 px rail.
      relatedWidth: 122,
      relatedRadius: 14,
      relatedGap: 11,
      relatedImageHeight: 92,
      // `padding: 12px 16px; gap: 10px` buy bar.
      buyBarPaddingX: 16,
      buyBarPaddingY: 12,
      buyBarGap: 10,
    });
  });

  it('pins the seller-store and wishlist geometry to the prototype', () => {
    expect(mobile.sellerStore).toMatchObject({
      // A 148 px cover with a 34 px back control inset 14 px.
      coverHeight: 148,
      backSize: 34,
      backIconSize: 20,
      backInset: 14,
      // `width: 68px; border-radius: 18px; border: 3px solid #fff`, pulled 34 px over the cover.
      tileSize: 68,
      tileRadius: 18,
      tileBorder: 3,
      tileOverlap: -34,
      paddingX: 18,
      // `height: 34px; padding: 0 16px` follow pill.
      followHeight: 34,
      followPaddingX: 16,
      // `border-radius: 14px; padding: 12px` stat blocks, 10 px apart.
      statRadius: 14,
      statPadding: 12,
      statGap: 10,
      // `gap: 18px` tabs with a 2.5 px active rule.
      tabGap: 18,
      tabPaddingBottom: 10,
      tabIndicatorWidth: 2.5,
      // `height: 112px` product image, taller than the category grid's 104.
      productImageHeight: 112,
    });
    expect(mobile.wishlist).toMatchObject({
      cellRadius: 16,
      removeSize: 30,
      actionHeight: 34,
      // `padding: 9px 11px 12px` copy block.
      copyPaddingX: 11,
      copyPaddingTop: 9,
      copyPaddingBottom: 12,
    });
  });

  it('carries the two type steps Phase 7 needed', () => {
    // `font-size: 9.5px` badge pills, related titles and stat labels; the 25 px PDP price.
    expect(fontSizes.nano).toBe(9.5);
    expect(fontSizes.priceHero).toBe(25);
  });

  it('keeps the Arabic face and line height behind single tokens', () => {
    expect(fontFamilies.arabic.regular).toBe('NotoKufiArabic_400Regular');
    expect(lineHeights.arabic).toBe(1.75);
  });
});
