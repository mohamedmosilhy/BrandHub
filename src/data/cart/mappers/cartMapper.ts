import { Money } from '@core/money';

import { Quantity, type Cart } from '@domain/cart';

import type { CartDto } from '@data/cart/dto';
import { mapProduct, type AssetUrlResolver } from '@data/catalog/mappers';

export function mapCart(dto: CartDto, resolveUrl?: AssetUrlResolver): Cart {
  return {
    id: dto.id,
    lines: dto.items.map((item) => {
      const product = mapProduct(item.product, resolveUrl);
      const variant = product.variants.find(
        (candidate) => candidate.id === item.variantId,
      );
      if (!variant)
        throw new Error(`Cart variant ${item.variantId} is missing.`);
      return {
        id: item.id,
        product,
        variant,
        quantity: Quantity.create(item.quantity),
        unitPrice: Money.fromDecimal(item.unitPrice),
        lineTotal: Money.fromDecimal(item.lineTotal),
      };
    }),
  };
}
