import { Money } from '@core/money';

import { criteriaToQueryParams } from './queryParams';

describe('criteriaToQueryParams', () => {
  it('translates domain criteria into the API contract without leaking Money', () => {
    expect(
      criteriaToQueryParams(
        {
          query: 'coffee',
          categoryId: 'cat-home',
          sellerId: 'seller-bait',
          sort: 'price-desc',
          inStock: true,
          minPrice: Money.fromDecimal('10.500'),
          maxPrice: Money.fromDecimal('30.000'),
          minRating: 4,
        },
        2,
        20,
      ),
    ).toEqual({
      q: 'coffee',
      categoryId: 'cat-home',
      sellerId: 'seller-bait',
      sort: 'price-desc',
      inStock: true,
      express: undefined,
      minPrice: '10.500',
      maxPrice: '30.000',
      minRating: 4,
      page: 2,
      size: 20,
    });
  });
});
