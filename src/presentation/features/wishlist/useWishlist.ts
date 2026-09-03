import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { Product } from '@domain/catalog';
import type {
  ToggleWishlistUseCase,
  WishlistItem,
  WishlistRepository,
} from '@domain/wishlist';

import { wishlistKeys } from '@presentation/features/catalog';

async function valueOf<T>(
  operation: Promise<
    import('@core/result').Result<T, import('@core/errors').AppError>
  >,
) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

export type WishlistView = Readonly<{
  items: readonly WishlistItem[];
  savedIds: ReadonlySet<string>;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  /** True while the list is gated — a guest has no wishlist to read (D3). */
  gated: boolean;
  isSaved: (productId: string) => boolean;
  toggle: (product: Product) => void;
}>;

/**
 * One cache holds the saved products; every heart in the app reads its membership from it, so a
 * toggle on a card and the wishlist screen itself can never disagree.
 *
 * The toggle is optimistic (§16.5): the cache is rewritten before the request leaves, the
 * snapshot is restored if it fails, and the failure is surfaced by `onFailure` rather than
 * swallowed. Adding needs the whole product, not just its id, because the cache holds products —
 * every caller already has one in hand.
 */
export function useWishlist({
  repository,
  toggleWishlist,
  locale,
  authenticated,
  onRequireAuth,
  onFailure,
}: {
  repository: WishlistRepository;
  toggleWishlist: ToggleWishlistUseCase;
  locale: string;
  authenticated: boolean;
  onRequireAuth: () => void;
  onFailure: () => void;
}): WishlistView {
  const client = useQueryClient();
  const key = wishlistKeys.all(locale);
  const query = useQuery({
    queryKey: key,
    queryFn: () => valueOf(repository.list()),
    enabled: authenticated,
  });
  const items = useMemo(() => query.data ?? [], [query.data]);
  const savedIds = useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items],
  );

  const mutation = useMutation({
    mutationFn: ({ product, saved }: { product: Product; saved: boolean }) =>
      valueOf(toggleWishlist.execute(product.id, saved)),
    onMutate: async ({ product, saved }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<readonly WishlistItem[]>(key) ?? [];
      client.setQueryData<readonly WishlistItem[]>(
        key,
        saved
          ? previous.filter((item) => item.productId !== product.id)
          : [{ productId: product.id, product }, ...previous],
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) client.setQueryData(key, context.previous);
      onFailure();
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
    },
  });

  const isSaved = useCallback(
    (productId: string) => savedIds.has(productId),
    [savedIds],
  );

  const toggle = useCallback(
    (product: Product) => {
      if (!authenticated) {
        onRequireAuth();
        return;
      }
      mutation.mutate({ product, saved: savedIds.has(product.id) });
    },
    [authenticated, mutation, onRequireAuth, savedIds],
  );

  return {
    items,
    savedIds,
    isPending: authenticated && query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
    gated: !authenticated,
    isSaved,
    toggle,
  };
}
