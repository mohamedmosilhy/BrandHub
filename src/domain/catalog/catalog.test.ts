import { Money } from '@core/money';

import {
  compareProducts,
  discountPercent,
  normalizeSearchCriteria,
} from '@domain/catalog';

import { buildProduct } from '@test/builders';

describe('catalogue domain rules', () => {
  it('derives BR11 discounts from the base and sale prices', () => {
    expect(discountPercent(buildProduct())).toBe(20);
    expect(discountPercent(buildProduct({ originalPrice: null }))).toBe(0);
    expect(
      discountPercent(
        buildProduct({
          price: Money.fromDecimal(30),
          originalPrice: Money.fromDecimal(25),
        }),
      ),
    ).toBe(0);
  });

  it('normalizes query whitespace, defaults relevance, and clamps ratings', () => {
    expect(
      normalizeSearchCriteria({ query: '  smart   watch ', minRating: 9 }),
    ).toEqual({ query: 'smart watch', sort: 'relevance', minRating: 5 });
  });

  it('sorts by rating and both price directions', () => {
    const low = buildProduct({
      id: 'low',
      price: Money.fromDecimal(5),
      rating: 3,
    });
    const high = buildProduct({
      id: 'high',
      price: Money.fromDecimal(20),
      rating: 5,
    });
    expect(
      [low, high].sort(compareProducts('top-rated')).map((item) => item.id),
    ).toEqual(['high', 'low']);
    expect(
      [high, low].sort(compareProducts('price-asc')).map((item) => item.id),
    ).toEqual(['low', 'high']);
    expect(
      [low, high].sort(compareProducts('price-desc')).map((item) => item.id),
    ).toEqual(['high', 'low']);
  });
});
