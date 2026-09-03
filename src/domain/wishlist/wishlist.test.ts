import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  ToggleWishlistUseCase,
  wishlistIds,
  type WishlistItem,
  type WishlistRepository,
} from '@domain/wishlist';

import { buildProduct } from '@test/builders';

function repository(): WishlistRepository & {
  add: jest.Mock;
  remove: jest.Mock;
} {
  return {
    list: jest.fn(async () => ok([])),
    add: jest.fn(async () => ok(undefined)),
    remove: jest.fn(async () => ok(undefined)),
  } as unknown as WishlistRepository & { add: jest.Mock; remove: jest.Mock };
}

describe('BR6 — wishlist membership toggles and never duplicates', () => {
  it('adds a product that is not saved yet', async () => {
    const wishlist = repository();
    const result = await new ToggleWishlistUseCase(wishlist).execute(
      'product-1',
      false,
    );

    expect(wishlist.add).toHaveBeenCalledWith('product-1');
    expect(wishlist.remove).not.toHaveBeenCalled();
    expect(result).toEqual(ok({ productId: 'product-1', saved: true }));
  });

  it('removes rather than duplicating a product that is already saved', async () => {
    const wishlist = repository();
    const result = await new ToggleWishlistUseCase(wishlist).execute(
      'product-1',
      true,
    );

    expect(wishlist.remove).toHaveBeenCalledWith('product-1');
    expect(wishlist.add).not.toHaveBeenCalled();
    expect(result).toEqual(ok({ productId: 'product-1', saved: false }));
  });

  it('reports the repository failure instead of claiming a toggle', async () => {
    const wishlist = repository();
    const failure = new ServerError(500, {
      code: 'SERVER_ERROR',
      message: 'nope',
      correlationId: 'test',
    });
    wishlist.add.mockResolvedValue(err(failure));

    const result = await new ToggleWishlistUseCase(wishlist).execute(
      'product-1',
      false,
    );

    expect(result).toEqual(err(failure));
  });

  it('reduces saved items to the id set every heart reads', () => {
    const items: WishlistItem[] = [
      { productId: 'product-1', product: buildProduct({ id: 'product-1' }) },
      { productId: 'product-2', product: buildProduct({ id: 'product-2' }) },
    ];
    expect([...wishlistIds(items)]).toEqual(['product-1', 'product-2']);
  });
});
