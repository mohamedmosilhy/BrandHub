import { DomainError, type AppError } from '@core/errors';
import { err, type Result } from '@core/result';

import type { Product, ProductVariant } from '@domain/catalog';

import type { CartRepository } from './CartRepository';
import type { Cart, CartLine } from './entities';

function cartError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return new DomainError({
    code,
    message,
    correlationId: 'domain-cart',
    ...(details ? { details } : {}),
  });
}

export class AddToCartUseCase {
  constructor(private readonly repository: CartRepository) {}

  async execute(
    product: Product,
    variant: ProductVariant,
    quantity = 1,
  ): Promise<Result<Cart, AppError>> {
    if (!product.variants.some((item) => item.id === variant.id)) {
      return err(
        cartError('INVALID_VARIANT', 'Variant does not belong to product.'),
      );
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return err(
        cartError('INSUFFICIENT_STOCK', 'Requested quantity is unavailable.', {
          productId: product.id,
          productName: product.title,
          available: variant.stock,
        }),
      );
    }
    const current = await this.repository.get();
    if (!current.ok) return current;
    const existing = current.value.lines.find(
      (line) => line.variant.id === variant.id,
    );
    if ((existing?.quantity.value ?? 0) + quantity > variant.stock) {
      return err(
        cartError('INSUFFICIENT_STOCK', 'Requested quantity is unavailable.', {
          productId: product.id,
          productName: product.title,
          available: variant.stock,
        }),
      );
    }
    return this.repository.add({ product, variant, quantity });
  }
}

export class UpdateCartLineUseCase {
  constructor(private readonly repository: CartRepository) {}

  execute(line: CartLine, quantity: number): Promise<Result<Cart, AppError>> {
    if (quantity <= 0) return this.repository.remove(line.id);
    if (!Number.isInteger(quantity) || quantity > line.variant.stock) {
      return Promise.resolve(
        err(
          cartError(
            'INSUFFICIENT_STOCK',
            'Requested quantity is unavailable.',
            {
              productId: line.product.id,
              productName: line.product.title,
              available: line.variant.stock,
            },
          ),
        ),
      );
    }
    return this.repository.update(line.id, quantity);
  }
}

export class RemoveCartLineUseCase {
  constructor(private readonly repository: CartRepository) {}

  execute(lineId: string): Promise<Result<Cart, AppError>> {
    return this.repository.remove(lineId);
  }
}
