import { Money } from '@core/money';
import { ok } from '@core/result';

import { buildProduct } from '@test/builders';

import type { CartRepository } from './CartRepository';
import { Quantity, cartSubtotal, type Cart } from './entities';
import { AddToCartUseCase, UpdateCartLineUseCase } from './useCases';

function cart(quantity = 2): Cart {
  const product = buildProduct();
  const variant = product.variants[0]!;
  return {
    id: 'cart-1',
    lines: [
      {
        id: 'line-1',
        product,
        variant,
        quantity: Quantity.create(quantity),
        unitPrice: variant.price,
        lineTotal: variant.price.times(quantity),
      },
    ],
  };
}

function repository(value = cart()): CartRepository {
  return {
    get: jest.fn(async () => ok(value)),
    add: jest.fn(async () => ok(value)),
    update: jest.fn(async () => ok(value)),
    remove: jest.fn(async () => ok({ id: value.id, lines: [] })),
    clear: jest.fn(async () => ok(undefined)),
  };
}

describe('cart domain', () => {
  it('calculates BR1 subtotal to the baisa', () => {
    expect(cartSubtotal(cart()).toDecimalString()).toBe('39.800');
  });

  it('adds a valid variant and rejects quantity beyond stock', async () => {
    const repo = repository();
    const product = buildProduct();
    const variant = product.variants[0]!;
    expect(
      (await new AddToCartUseCase(repo).execute(product, variant, 1)).ok,
    ).toBe(true);
    const rejected = await new AddToCartUseCase(repo).execute(
      product,
      variant,
      11,
    );
    expect(rejected.ok).toBe(false);
    expect(repo.add).toHaveBeenCalledTimes(1);
  });

  it('implements BR4 by removing a line when quantity reaches zero', async () => {
    const value = cart(1);
    const repo = repository(value);
    await new UpdateCartLineUseCase(repo).execute(value.lines[0]!, 0);
    expect(repo.remove).toHaveBeenCalledWith('line-1');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects invalid Quantity values', () => {
    expect(() => Quantity.create(0)).toThrow(RangeError);
    expect(() => Quantity.create(1.5)).toThrow(RangeError);
    expect(Quantity.create(99).value).toBe(99);
  });

  it('uses integer Money arithmetic for a varied line set', () => {
    const product = buildProduct();
    const lines = Array.from({ length: 40 }, (_, index) => {
      const unitPrice = Money.fromBaisa(1 + ((index * 7919) % 85_000));
      const quantity = Quantity.create(1 + (index % 8));
      return {
        id: `line-${index}`,
        product,
        variant: product.variants[0]!,
        quantity,
        unitPrice,
        lineTotal: unitPrice.times(quantity.value),
      };
    });
    const expected = lines.reduce(
      (sum, line) => sum + line.unitPrice.baisa * line.quantity.value,
      0,
    );
    expect(cartSubtotal({ id: 'random-cart', lines }).baisa).toBe(expected);
  });
});
