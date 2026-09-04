import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Product, ProductVariant } from '@domain/catalog';

import type { Cart } from './entities';

export type AddCartItem = Readonly<{
  product: Product;
  variant: ProductVariant;
  quantity: number;
}>;

export interface CartRepository {
  get(): Promise<Result<Cart, AppError>>;
  add(input: AddCartItem): Promise<Result<Cart, AppError>>;
  update(lineId: string, quantity: number): Promise<Result<Cart, AppError>>;
  remove(lineId: string): Promise<Result<Cart, AppError>>;
  clear(): Promise<Result<void, AppError>>;
}
