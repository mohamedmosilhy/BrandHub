import { ok } from '@core/result';

import { Quantity, type Cart, type CartRepository } from '@domain/cart';

import { buildProduct } from '@test/builders';

import { SessionAwareCartRepository } from './CartRepositories';

const product = buildProduct();
const guestCart: Cart = {
  id: 'guest',
  lines: [
    {
      id: 'guest-line',
      product,
      variant: product.variants[0]!,
      quantity: Quantity.create(2),
      unitPrice: product.price,
      lineTotal: product.price.times(2),
    },
  ],
};
const empty: Cart = { id: 'remote', lines: [] };

function cartRepository(value: Cart): CartRepository {
  return {
    get: jest.fn(async () => ok(value)),
    add: jest.fn(async () => ok(value)),
    update: jest.fn(async () => ok(value)),
    remove: jest.fn(async () => ok({ ...value, lines: [] })),
    clear: jest.fn(async () => ok(undefined)),
  };
}

describe('SessionAwareCartRepository', () => {
  it('merges the persisted guest cart into the signed-in cart once (D3)', async () => {
    const local = cartRepository(guestCart);
    const remote = cartRepository(empty);
    const tokens = {
      getAccessToken: jest.fn(async () => 'access'),
      getRefreshToken: jest.fn(async () => null),
      saveTokens: jest.fn(async () => undefined),
      clearSession: jest.fn(async () => undefined),
      getStatus: jest.fn(() => 'authenticated' as const),
    };
    const repository = new SessionAwareCartRepository(local, remote, tokens);

    await repository.get();

    expect(remote.add).toHaveBeenCalledWith({
      product,
      variant: product.variants[0],
      quantity: 2,
    });
    expect(local.remove).toHaveBeenCalledWith('guest-line');
  });
});
