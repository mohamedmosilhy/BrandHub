import { NetworkError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import { Quantity, type Cart, type CartRepository } from '@domain/cart';
import type { CheckoutDraft } from '@domain/checkout';

import { buildProduct } from '@test/builders';

import { orderTimeline, type Order, type OrderStatus } from './entities';
import type { OrderRepository } from './OrderRepository';
import {
  GetOrdersUseCase,
  PlaceOrderUseCase,
  RequestReturnUseCase,
} from './useCases';

/** Every port method defaults to a mock, so a test only names what it cares about. */
function orderRepository(
  overrides: Partial<Record<keyof OrderRepository, jest.Mock>> = {},
): jest.Mocked<OrderRepository> {
  return {
    place: jest.fn(async () => ok(order)),
    getById: jest.fn(async () => ok(order)),
    list: jest.fn(async () => ok([order])),
    requestReturn: jest.fn(async () => ok(returnRequest)),
    ...overrides,
  } as unknown as jest.Mocked<OrderRepository>;
}

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

const returnRequest = {
  id: 'return-1',
  returnNumber: 'RET-3001',
  orderId: 'order-1',
  reason: 'Arrived damaged',
  status: 'PENDING',
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
    const orders = orderRepository({ place: jest.fn() });
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
    const orders = orderRepository({
      place: jest.fn(async (_draft, key) => {
        seen.push(key);
        return seen.length === 1 ? err(failure) : ok(order);
      }),
      getById: jest.fn(async () => ok(order)),
    });
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

describe('orderTimeline', () => {
  it.each([
    ['PENDING', [true, false, false, false]],
    ['CONFIRMED', [true, true, false, false]],
    ['PROCESSING', [true, true, false, false]],
    ['SHIPPED', [true, true, true, false]],
    ['DELIVERED', [true, true, true, true]],
  ])('completes the steps %s has reached (AC9.6)', (status, expected) => {
    expect(
      orderTimeline(status as OrderStatus).map((step) => step.complete),
    ).toEqual(expected);
  });

  it.each(['CANCELLED', 'UNKNOWN'])(
    'completes no step for %s, which claims no progress',
    (status) => {
      expect(
        orderTimeline(status as OrderStatus).every((step) => !step.complete),
      ).toBe(true);
    },
  );

  it('always names the prototype’s four steps in order', () => {
    expect(orderTimeline('PENDING').map((step) => step.key)).toEqual([
      'CREATED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
    ]);
  });
});

describe('RequestReturnUseCase', () => {
  it('blocks a submission with no reason chosen (AC9.10)', async () => {
    const orders = orderRepository();

    const result = await new RequestReturnUseCase(orders).execute(
      'order-1',
      null,
    );

    expect(result.ok || result.error.code).toBe('RETURN_REASON_REQUIRED');
    expect(orders.requestReturn).not.toHaveBeenCalled();
  });

  it('refuses an order that is not delivered (BR8, AC9.9)', async () => {
    const orders = orderRepository({
      getById: jest.fn(async () => ok({ ...order, status: 'SHIPPED' })),
    });

    const result = await new RequestReturnUseCase(orders).execute(
      'order-1',
      'DAMAGED',
    );

    expect(result.ok || result.error.code).toBe('ORDER_NOT_RETURNABLE');
    expect(orders.requestReturn).not.toHaveBeenCalled();
  });

  it('submits a delivered order’s return with its reason and note (AC9.11)', async () => {
    const orders = orderRepository({
      getById: jest.fn(async () => ok({ ...order, status: 'DELIVERED' })),
    });

    const result = await new RequestReturnUseCase(orders).execute(
      'order-1',
      'DAMAGED',
      'The screen was cracked',
    );

    expect(result.ok).toBe(true);
    expect(orders.requestReturn).toHaveBeenCalledWith(
      'order-1',
      'DAMAGED',
      'The screen was cracked',
    );
  });
});

describe('GetOrdersUseCase', () => {
  it('asks for the first page at the default size unless told otherwise', async () => {
    const orders = orderRepository();

    await new GetOrdersUseCase(orders).execute();
    await new GetOrdersUseCase(orders).execute(2, 5);

    expect(orders.list).toHaveBeenNthCalledWith(1, 0, 20);
    expect(orders.list).toHaveBeenNthCalledWith(2, 2, 5);
  });
});
