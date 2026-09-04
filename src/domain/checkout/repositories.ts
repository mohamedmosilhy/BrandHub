import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Coupon, ShippingAddress, ShippingArea } from './entities';

export type NewShippingAddress = Readonly<{
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  areaId: string;
}>;

export interface CouponRepository {
  validate(code: string): Promise<Result<Coupon, AppError>>;
}

export interface ShippingAreaRepository {
  list(): Promise<Result<readonly ShippingArea[], AppError>>;
}

export interface CheckoutAddressRepository {
  list(): Promise<Result<readonly ShippingAddress[], AppError>>;
  save(input: NewShippingAddress): Promise<Result<ShippingAddress, AppError>>;
}
