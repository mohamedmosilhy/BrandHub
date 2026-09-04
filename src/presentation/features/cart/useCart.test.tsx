import { ServerError } from '@core/errors';
import { err, ok, type Result } from '@core/result';

import {
  AddToCartUseCase,
  Quantity,
  RemoveCartLineUseCase,
  UpdateCartLineUseCase,
  type Cart,
  type CartRepository,
} from '@domain/cart';
import { ApplyCouponUseCase, type CouponRepository } from '@domain/checkout';

import { Pressable, Text } from '@presentation/components/primitives';

import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { CartProvider, useCartContext } from './CartProvider';

const product = buildProduct();
const line = {
  id: 'line-1',
  product,
  variant: product.variants[0]!,
  quantity: Quantity.create(1),
  unitPrice: product.variants[0]!.price,
  lineTotal: product.variants[0]!.price,
};
const original: Cart = { id: 'cart-1', lines: [line] };

function Probe() {
  const cart = useCartContext();
  return (
    <>
      <Text accessibilityLabel="quantity">
        {cart.cart?.lines[0]?.quantity.value ?? 0}
      </Text>
      <Pressable
        accessibilityLabel="increase"
        onPress={() => void cart.update(line, 2)}
      >
        <Text>increase</Text>
      </Pressable>
    </>
  );
}

describe('cart optimistic quantity', () => {
  it('updates immediately and restores the server snapshot on failure (AC8.3)', async () => {
    let complete: ((result: Result<Cart, ServerError>) => void) | undefined;
    const repository: CartRepository = {
      get: jest.fn(async () => ok(original)),
      add: jest.fn(async () => ok(original)),
      update: jest.fn(
        () =>
          new Promise((resolve) => {
            complete = resolve;
          }),
      ),
      remove: jest.fn(async () => ok({ ...original, lines: [] })),
      clear: jest.fn(async () => ok(undefined)),
    };
    const coupons: CouponRepository = { validate: jest.fn() };
    await renderWithProviders(
      <CartProvider
        repository={repository}
        addToCart={new AddToCartUseCase(repository)}
        updateCartLine={new UpdateCartLineUseCase(repository)}
        removeCartLine={new RemoveCartLineUseCase(repository)}
        applyCoupon={new ApplyCouponUseCase(coupons)}
        sessionKey="guest"
      >
        <Probe />
      </CartProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText('quantity')).toHaveTextContent('1'),
    );

    fireEvent.press(screen.getByLabelText('increase'));
    await waitFor(() =>
      expect(screen.getByLabelText('quantity')).toHaveTextContent('2'),
    );
    complete?.(
      err(
        new ServerError(500, {
          code: 'SERVER_ERROR',
          message: 'failed',
          correlationId: 'cart-test',
        }),
      ),
    );

    await waitFor(() =>
      expect(screen.getByLabelText('quantity')).toHaveTextContent('1'),
    );
  });
});
