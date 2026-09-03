import type { AppError } from '@core/errors';
import { ok, type Result } from '@core/result';

import type { WishlistRepository } from './WishlistRepository';

export type WishlistToggle = Readonly<{ productId: string; saved: boolean }>;

/**
 * BR6: wishlist membership toggles and never duplicates. The caller passes the membership it is
 * currently showing, so the decision is made here rather than in a screen, and a second tap on
 * an already-saved product removes it instead of adding a duplicate row.
 */
export class ToggleWishlistUseCase {
  constructor(private readonly wishlist: WishlistRepository) {}

  async execute(
    productId: string,
    currentlySaved: boolean,
  ): Promise<Result<WishlistToggle, AppError>> {
    const result = currentlySaved
      ? await this.wishlist.remove(productId)
      : await this.wishlist.add(productId);
    if (!result.ok) return result;
    return ok({ productId, saved: !currentlySaved });
  }
}
