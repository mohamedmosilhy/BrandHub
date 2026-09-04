import { Money } from '@core/money';

import type { Product, ProductVariant } from '@domain/catalog';

export class Quantity {
  private constructor(readonly value: number) {
    Object.freeze(this);
  }

  static create(value: number): Quantity {
    if (!Number.isInteger(value) || value < 1 || value > 99) {
      throw new RangeError('Quantity must be an integer from 1 to 99.');
    }
    return new Quantity(value);
  }
}

export type CartLine = Readonly<{
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: Quantity;
  unitPrice: Money;
  lineTotal: Money;
}>;

export type Cart = Readonly<{
  id: string;
  lines: readonly CartLine[];
}>;

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((total, line) => total + line.quantity.value, 0);
}

export function cartSubtotal(cart: Cart): Money {
  return cart.lines.reduce(
    (total, line) => total.plus(line.unitPrice.times(line.quantity.value)),
    Money.zero(),
  );
}
