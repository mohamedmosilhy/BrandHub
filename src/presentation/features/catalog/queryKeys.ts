import type { SearchCriteria } from '@domain/catalog';

export function criteriaKey(criteria: SearchCriteria) {
  return {
    query: criteria.query ?? '',
    categoryId: criteria.categoryId ?? '',
    sellerId: criteria.sellerId ?? '',
    sort: criteria.sort ?? 'relevance',
    inStock: criteria.inStock ?? false,
    express: criteria.express ?? false,
    minPrice: criteria.minPrice?.baisa ?? null,
    maxPrice: criteria.maxPrice?.baisa ?? null,
    minRating: criteria.minRating ?? null,
  } as const;
}

export const catalogKeys = {
  categories: (locale: string) => ['catalog', 'categories', locale] as const,
  category: (locale: string, id: string) =>
    ['catalog', 'category', locale, id] as const,
  featured: (locale: string) => ['catalog', 'featured', locale] as const,
  search: (locale: string, criteria: SearchCriteria, size = 20) =>
    ['catalog', 'search', locale, criteriaKey(criteria), size] as const,
  detail: (locale: string, id: string) =>
    ['catalog', 'detail', locale, id] as const,
  related: (locale: string, id: string) =>
    ['catalog', 'related', locale, id] as const,
  reviews: (locale: string, id: string) =>
    ['catalog', 'reviews', locale, id] as const,
  seller: (locale: string, id: string) =>
    ['catalog', 'seller', locale, id] as const,
  sellerProducts: (locale: string, id: string) =>
    ['catalog', 'seller-products', locale, id] as const,
};

/** D9: catalogue content is locale-resolved server-side, so saved products key on locale too. */
export const wishlistKeys = {
  all: (locale: string) => ['wishlist', locale] as const,
};
