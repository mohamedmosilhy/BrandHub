import { Money } from '@core/money';

export const productSorts = [
  'relevance',
  'top-rated',
  'price-asc',
  'price-desc',
] as const;

export type ProductSort = (typeof productSorts)[number];

export type SearchCriteria = Readonly<{
  query?: string;
  categoryId?: string;
  sellerId?: string;
  sort?: ProductSort;
  inStock?: boolean;
  /** Contract placeholder only until GAP-15 receives server data (D21). */
  express?: boolean;
  minPrice?: Money;
  maxPrice?: Money;
  minRating?: number;
}>;

export type Page<T> = Readonly<{
  items: readonly T[];
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
}>;

export function normalizeSearchCriteria(
  criteria: SearchCriteria,
): SearchCriteria {
  const query = criteria.query?.trim().replace(/\s+/g, ' ');
  return {
    ...(query ? { query } : {}),
    ...(criteria.categoryId ? { categoryId: criteria.categoryId } : {}),
    ...(criteria.sellerId ? { sellerId: criteria.sellerId } : {}),
    sort: criteria.sort ?? 'relevance',
    ...(criteria.inStock ? { inStock: true } : {}),
    ...(criteria.express ? { express: true } : {}),
    ...(criteria.minPrice ? { minPrice: criteria.minPrice } : {}),
    ...(criteria.maxPrice ? { maxPrice: criteria.maxPrice } : {}),
    ...(criteria.minRating !== undefined
      ? { minRating: Math.max(0, Math.min(5, criteria.minRating)) }
      : {}),
  };
}

export function compareProducts(sort: ProductSort) {
  return (
    a: import('./entities').Product,
    b: import('./entities').Product,
  ): number => {
    switch (sort) {
      case 'top-rated':
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      case 'price-asc':
        return a.price.compare(b.price);
      case 'price-desc':
        return b.price.compare(a.price);
      case 'relevance':
        return 0;
    }
  };
}
