import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import type {
  CategoryRepository,
  GetCategoryProductsUseCase,
  ProductRepository,
  SearchCriteria,
  SearchProductsUseCase,
} from '@domain/catalog';

import { catalogKeys } from './queryKeys';

const PAGE_SIZE = 20;

async function valueOf<T>(
  operation: Promise<
    import('@core/result').Result<T, import('@core/errors').AppError>
  >,
) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

export function useHomeQueries(
  categories: CategoryRepository,
  products: ProductRepository,
  locale: string,
) {
  return {
    categories: useQuery({
      queryKey: catalogKeys.categories(locale),
      queryFn: () => valueOf(categories.getTree()),
    }),
    deals: useQuery({
      queryKey: catalogKeys.featured(locale),
      queryFn: () => valueOf(products.getFeatured()),
    }),
  };
}

export function useCategories(repository: CategoryRepository, locale: string) {
  return useQuery({
    queryKey: catalogKeys.categories(locale),
    queryFn: () => valueOf(repository.getTree()),
  });
}

export function useCategory(
  repository: CategoryRepository,
  locale: string,
  id: string,
) {
  return useQuery({
    queryKey: catalogKeys.category(locale, id),
    queryFn: () => valueOf(repository.getById(id)),
  });
}

export function useSearchProducts(
  useCase: SearchProductsUseCase,
  locale: string,
  criteria: SearchCriteria,
  enabled = true,
  size = PAGE_SIZE,
) {
  return useInfiniteQuery({
    queryKey: catalogKeys.search(locale, criteria, size),
    queryFn: ({ pageParam }) =>
      valueOf(useCase.execute(criteria, pageParam, size)),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled,
  });
}

export function useCategoryProducts(
  useCase: GetCategoryProductsUseCase,
  locale: string,
  categoryId: string,
  criteria: SearchCriteria,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: catalogKeys.search(locale, { ...criteria, categoryId }),
    queryFn: ({ pageParam }) =>
      valueOf(useCase.execute(categoryId, criteria, pageParam, PAGE_SIZE)),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled,
  });
}

export function useProductPrefetch(
  repository: ProductRepository,
  locale: string,
) {
  const client = useQueryClient();
  return useCallback(
    (id: string) => {
      void client.prefetchQuery({
        queryKey: catalogKeys.detail(locale, id),
        queryFn: () => valueOf(repository.getById(id)),
        staleTime: 60_000,
      });
    },
    [client, locale, repository],
  );
}

export function productPages(
  data: ReturnType<typeof useSearchProducts>['data'],
) {
  return data?.pages.flatMap((page) => page.items) ?? [];
}
