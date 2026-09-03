import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type {
  GetProductDetailUseCase,
  GetRelatedProductsUseCase,
  ReviewRepository,
  SellerRepository,
} from '@domain/catalog';

import { catalogKeys } from '@presentation/features/catalog';

const REVIEW_PAGE_SIZE = 10;

async function valueOf<T>(
  operation: Promise<
    import('@core/result').Result<T, import('@core/errors').AppError>
  >,
) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

/**
 * Four independent queries rather than one aggregate: a slow review page must not hold back the
 * hero, and a failing related rail must not blank the buy bar (§22.5, AC6.2's rule applied here).
 */
export function useProductDetail(
  useCase: GetProductDetailUseCase,
  locale: string,
  id: string,
) {
  return useQuery({
    queryKey: catalogKeys.detail(locale, id),
    queryFn: () => valueOf(useCase.execute(id)),
  });
}

export function useRelatedProducts(
  useCase: GetRelatedProductsUseCase,
  locale: string,
  id: string,
) {
  return useQuery({
    queryKey: catalogKeys.related(locale, id),
    queryFn: () => valueOf(useCase.execute(id)),
  });
}

export function useProductReviews(
  repository: ReviewRepository,
  locale: string,
  id: string,
) {
  return useInfiniteQuery({
    queryKey: catalogKeys.reviews(locale, id),
    queryFn: ({ pageParam }) =>
      valueOf(repository.listByProduct(id, pageParam, REVIEW_PAGE_SIZE)),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });
}

export function useSeller(
  repository: SellerRepository,
  locale: string,
  id: string,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogKeys.seller(locale, id),
    queryFn: () => valueOf(repository.getById(id)),
    enabled,
  });
}

export function useSellerProducts(
  repository: SellerRepository,
  locale: string,
  id: string,
) {
  return useInfiniteQuery({
    queryKey: catalogKeys.sellerProducts(locale, id),
    queryFn: ({ pageParam }) => valueOf(repository.getProducts(id, pageParam)),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });
}
