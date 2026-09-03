import type { SearchCriteria } from '@domain/catalog';

export function criteriaToQueryParams(
  criteria: SearchCriteria,
  page: number,
  size: number,
): Readonly<Record<string, string | number | boolean | undefined>> {
  return {
    q: criteria.query,
    categoryId: criteria.categoryId,
    sellerId: criteria.sellerId,
    sort: criteria.sort ?? 'relevance',
    inStock: criteria.inStock || undefined,
    express: criteria.express || undefined,
    minPrice: criteria.minPrice?.toDecimalString(),
    maxPrice: criteria.maxPrice?.toDecimalString(),
    minRating: criteria.minRating,
    page,
    size,
  };
}
