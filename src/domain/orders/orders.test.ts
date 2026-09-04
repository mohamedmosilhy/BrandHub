import { NetworkError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import { Quantity, type Cart, type CartRepository } from '@domain/cart';
import type { CheckoutDraft } from '@domain/checkout';

import { buildProduct } from '@test/builders';

import type { Order } from './entities';
import type { OrderRepository } from './OrderRepository';
import { PlaceOrderUseCase } from './useCases';

const product = buildProduct();
const cart: Cart = {
  id: 'cart-1',
  lines: [
    {
      id: 'line-1',
      product,
      variant: product.variants[0]!,
      quantity: Quantity.create(1),
      unitPrice: product.price,
      lineTotal: product.price,
    },
  ],
};
const draft: CheckoutDraft = {
  shippingAddressId: 'address-1',
  paymentMethod: 'CREDIT_CARD',
  coupon: null,
};
const order: Order = {
  id: 'order-1',
  orderNumber: 'BH-300001',
  status: 'PENDING',
  lines: cart.lines,
  subtotal: product.price,
  vat: product.price.percentage(5),
  shipping: Money.zero(),
  paymentFee: Money.zero(),
  discount: Money.zero(),
  total: product.price.plus(product.price.percentage(5)),
  shippingAddressId: 'address-1',
  paymentMethod: 'CREDIT_CARD',
  deliveryOtp: '1234',
  createdAt: '2026-09-04T00:00:00.000Z',
};

const cartRepository: CartRepository = {
  get: jest.fn(async () => ok(cart)),
  add: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
};

describe('PlaceOrderUseCase', () => {
  it('rejects BR5 empty carts before calling the order repository', async () => {
    const emptyRepository = {
      ...cartRepository,
      get: jest.fn(async () => ok({ id: 'x', lines: [] })),
    };
    const orders: OrderRepository = { place: jest.fn(), getById: jest.fn() };
    expect(
      (await new PlaceOrderUseCase(emptyRepository, orders).execute(draft)).ok,
    ).toBe(false);
    expect(orders.place).not.toHaveBeenCalled();
  });

  it('reuses the idempotency key after a network failure and returns one order', async () => {
    const seen: IdempotencyKey[] = [];
    const failure = new NetworkError({
      code: 'NETWORK_UNAVAILABLE',
      message: 'offline',
      correlationId: 'test',
    });
    const orders: OrderRepository = {
      place: jest.fn(async (_draft, key) => {
        seen.push(key);
        return seen.length === 1 ? err(failure) : ok(order);
      }),
      getById: jest.fn(async () => ok(order)),
    };
    const useCase = new PlaceOrderUseCase(
      cartRepository,
      orders,
      () => 'attempt-one' as IdempotencyKey,
    );
    expect((await useCase.execute(draft)).ok).toBe(false);
    expect((await useCase.execute(draft)).ok).toBe(true);
    expect(seen).toEqual(['attempt-one', 'attempt-one']);
    expect(cartRepository.get).toHaveBeenCalledTimes(1);
  });
});
