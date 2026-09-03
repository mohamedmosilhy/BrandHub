import { ok } from '@core/result';

import {
  ToggleWishlistUseCase,
  type WishlistItem,
  type WishlistRepository,
} from '@domain/wishlist';

import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { WishlistProvider } from './WishlistProvider';
import { WishlistScreen } from './WishlistScreen';

const product = buildProduct({ id: 'product-4', title: 'حقيبة جلدية' });

/** Stateful on purpose: the refetch after a toggle has to agree with the optimistic write. */
function repository(initial: WishlistItem[]) {
  let items = [...initial];
  return {
    list: jest.fn(async () => ok(items)),
    add: jest.fn(async () => ok(undefined)),
    remove: jest.fn(async (productId: string) => {
      items = items.filter((item) => item.productId !== productId);
      return ok(undefined);
    }),
  } as WishlistRepository;
}

async function mount(items: WishlistItem[], onDiscover = jest.fn()) {
  const wishlist = repository(items);
  await renderWithProviders(
    <WishlistProvider
      repository={wishlist}
      toggleWishlist={new ToggleWishlistUseCase(wishlist)}
      locale="ar"
      authenticated
      onRequireAuth={jest.fn()}
      onFailure={jest.fn()}
    >
      <WishlistScreen
        onBack={jest.fn()}
        onDiscover={onDiscover}
        onOpenProduct={jest.fn()}
      />
    </WishlistProvider>,
  );
  return { wishlist, onDiscover };
}

describe('WishlistScreen', () => {
  it('lists saved products with a remove action (AC7.6)', async () => {
    const { wishlist } = await mount([{ productId: product.id, product }]);

    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
    expect(screen.getByText('19.900')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('إزالة من المفضلة'));

    await waitFor(() =>
      expect(wishlist.remove).toHaveBeenCalledWith(product.id),
    );
    await waitFor(() => expect(screen.queryByText(product.title)).toBeNull());
  });

  it('offers the discover action when nothing is saved (AC7.13)', async () => {
    const { onDiscover } = await mount([]);

    await waitFor(() =>
      expect(screen.getByText('لا توجد منتجات في المفضلة')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('اكتشف المنتجات'));

    expect(onDiscover).toHaveBeenCalledTimes(1);
  });
});
