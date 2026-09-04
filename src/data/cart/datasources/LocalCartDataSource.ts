import type { AddCartItem } from '@domain/cart';

import { cartDtoSchema, type CartDto } from '@data/cart/dto';
import type { ProductDto } from '@data/catalog/dto';

import type { KeyValueStore } from '@infrastructure/storage';

const CART_KEY = 'brandhub.cart.guest.v1';

const emptyCart = (): CartDto => ({
  id: 'cart-guest',
  userId: 'guest',
  items: [],
  subtotal: 0,
  currency: 'OMR',
});

function productDto(input: AddCartItem): ProductDto {
  const { product } = input;
  return {
    id: product.id,
    slug: product.slug,
    categoryId: product.categoryId,
    sellerId: product.sellerId,
    name: product.title,
    description: product.description,
    basePrice: (product.originalPrice ?? product.price).toDecimal(),
    salePrice: product.originalPrice ? product.price.toDecimal() : null,
    currency: 'OMR',
    stock: product.stock,
    featured: product.featured,
    createdAt: product.createdAt,
    salesCount: product.salesCount,
    averageRating: product.rating,
    reviewCount: product.reviewCount,
    images: product.images.map((image) => ({ ...image })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      attributes: { ...variant.attributes },
      stock: variant.stock,
      price: variant.price.toDecimal(),
    })),
    specs: product.specs.map((spec) => ({ ...spec })),
  };
}

function recompute(cart: CartDto): CartDto {
  const subtotal = cart.items.reduce((sum, line) => sum + line.lineTotal, 0);
  return { ...cart, subtotal: Number(subtotal.toFixed(3)) };
}

export class LocalCartDataSource {
  constructor(private readonly storage: KeyValueStore) {}

  async get(): Promise<CartDto> {
    const stored = await this.storage.get(CART_KEY);
    if (!stored) return emptyCart();
    const parsed = cartDtoSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : emptyCart();
  }

  private async save(cart: CartDto): Promise<CartDto> {
    const next = recompute(cart);
    await this.storage.set(CART_KEY, JSON.stringify(next));
    return next;
  }

  async add(input: AddCartItem): Promise<CartDto> {
    const cart = await this.get();
    const existing = cart.items.find(
      (line) => line.variantId === input.variant.id,
    );
    const items = existing
      ? cart.items.map((line) =>
          line.id === existing.id
            ? {
                ...line,
                quantity: line.quantity + input.quantity,
                lineTotal: Number(
                  (line.unitPrice * (line.quantity + input.quantity)).toFixed(
                    3,
                  ),
                ),
              }
            : line,
        )
      : [
          ...cart.items,
          {
            id: `guest-${input.variant.id}`,
            userId: 'guest',
            productId: input.product.id,
            variantId: input.variant.id,
            quantity: input.quantity,
            product: productDto(input),
            variant: {
              id: input.variant.id,
              sku: input.variant.sku,
              attributes: { ...input.variant.attributes },
              stock: input.variant.stock,
              price: input.variant.price.toDecimal(),
            },
            unitPrice: input.variant.price.toDecimal(),
            lineTotal: input.variant.price.times(input.quantity).toDecimal(),
          },
        ];
    return this.save({ ...cart, items });
  }

  async update(lineId: string, quantity: number): Promise<CartDto> {
    const cart = await this.get();
    return this.save({
      ...cart,
      items: cart.items.map((line) =>
        line.id === lineId
          ? {
              ...line,
              quantity,
              lineTotal: Number((line.unitPrice * quantity).toFixed(3)),
            }
          : line,
      ),
    });
  }

  async remove(lineId: string): Promise<CartDto> {
    const cart = await this.get();
    return this.save({
      ...cart,
      items: cart.items.filter((line) => line.id !== lineId),
    });
  }

  async clear(): Promise<void> {
    await this.storage.delete(CART_KEY);
  }
}
