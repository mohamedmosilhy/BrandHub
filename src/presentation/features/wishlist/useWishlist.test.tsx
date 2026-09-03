import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  ToggleWishlistUseCase,
  type WishlistItem,
  type WishlistRepository,
} from '@domain/wishlist';

import { Pressable, Text } from '@presentation/components/primitives';

import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { WishlistProvider, useWishlistContext } from './WishlistProvider';

const saved = buildProduct({ id: 'product-saved', title: 'محفوظ' });
const fresh = buildProduct({ id: 'product-fresh', title: 'جديد' });

function repository(overrides: Partial<WishlistRepository> = {}) {
  const items: WishlistItem[] = [{ productId: saved.id, product: saved }];
  return {
    list: jest.fn(async () => ok(items)),
    add: jest.fn(async () => ok(undefined)),
    remove: jest.fn(async () => ok(undefined)),
    ...overrides,
  } as WishlistRepository;
}

function Probe({ product }: { product: typeof fresh }) {
  const wishlist = useWishlistContext();
  if (!wishlist) return null;
  return (
    <>
      <Text accessibilityLabel="membership">
        {wishlist.isSaved(product.id) ? 'saved' : 'not-saved'}
      </Text>
      <Pressable
        accessibilityLabel="toggle"
        onPress={() => wishlist.toggle(product)}
      >
        <Text>toggle</Text>
      </Pressable>
    </>
  );
}

async function mount(
  wishlist: WishlistRepository,
  product = fresh,
  onRequireAuth = jest.fn(),
  authenticated = true,
) {
  const onFailure = jest.fn();
  await renderWithProviders(
    <WishlistProvider
      repository={wishlist}
      toggleWishlist={new ToggleWishlistUseCase(wishlist)}
      locale="ar"
      authenticated={authenticated}
      onRequireAuth={onRequireAuth}
      onFailure={onFailure}
    >
      <Probe product={product} />
    </WishlistProvider>,
  );
  return { onFailure, onRequireAuth };
}

describe('wishlist membership', () => {
  it('reflects the saved set the server returned (AC7.6)', async () => {
    await mount(repository(), saved);
    await waitFor(() =>
      expect(screen.getByLabelText('membership')).toHaveTextContent('saved'),
    );
  });

  it('rolls the optimistic add back and reports the failure (AC7.7)', async () => {
    const wishlist = repository({
      add: jest.fn(async () =>
        err(
          new ServerError(500, {
            code: 'SERVER_ERROR',
            message: 'failed',
            correlationId: 'cor-wishlist',
          }),
        ),
      ),
    });
    const { onFailure } = await mount(wishlist);
    await waitFor(() =>
      expect(screen.getByLabelText('membership')).toHaveTextContent(
        'not-saved',
      ),
    );

    fireEvent.press(screen.getByLabelText('toggle'));

    await waitFor(() => expect(onFailure).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByLabelText('membership')).toHaveTextContent(
        'not-saved',
      ),
    );
  });

  it('sends a guest to sign in instead of writing (D3)', async () => {
    const wishlist = repository();
    const onRequireAuth = jest.fn();
    await mount(wishlist, fresh, onRequireAuth, false);

    fireEvent.press(screen.getByLabelText('toggle'));

    expect(onRequireAuth).toHaveBeenCalledTimes(1);
    expect(wishlist.add).not.toHaveBeenCalled();
    expect(wishlist.list).not.toHaveBeenCalled();
  });
});
