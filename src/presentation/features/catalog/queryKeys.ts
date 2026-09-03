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
};
