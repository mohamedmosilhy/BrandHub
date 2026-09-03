import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type {
  ToggleWishlistUseCase,
  WishlistRepository,
} from '@domain/wishlist';

import { useWishlist, type WishlistView } from './useWishlist';

const WishlistContext = createContext<WishlistView | null>(null);

/**
 * Mounted once, above the navigator: every heart in the app — cards, the PDP, the wishlist
 * screen — reads one membership set and writes through one optimistic mutation, so no two
 * screens can show a product as saved and unsaved at the same time.
 */
export function WishlistProvider({
  children,
  repository,
  toggleWishlist,
  locale,
  authenticated,
  onRequireAuth,
  onFailure,
}: {
  children: ReactNode;
  repository: WishlistRepository;
  toggleWishlist: ToggleWishlistUseCase;
  locale: string;
  authenticated: boolean;
  onRequireAuth: () => void;
  onFailure: () => void;
}) {
  const value = useWishlist({
    repository,
    toggleWishlist,
    locale,
    authenticated,
    onRequireAuth,
    onFailure,
  });
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

/** Null outside the provider — the component gallery and isolated tests render without one. */
export function useWishlistContext(): WishlistView | null {
  return useContext(WishlistContext);
}

const EMPTY: ReadonlySet<string> = new Set();

/**
 * The heart props a product card needs, or `null` where there is no wishlist in scope. Screens
 * spread the result so a card outside the provider simply renders no heart.
 */
export function useWishlistCardProps() {
  const wishlist = useWishlistContext();
  return useMemo(
    () => ({
      savedIds: wishlist?.savedIds ?? EMPTY,
      onWishlist: wishlist?.toggle,
    }),
    [wishlist],
  );
}
