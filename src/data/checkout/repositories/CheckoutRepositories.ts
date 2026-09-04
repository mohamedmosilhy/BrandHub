import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type {
  CheckoutAddressRepository,
  CouponRepository,
  ShippingAreaRepository,
} from '@domain/checkout';

import type { CheckoutRemoteDataSource } from '@data/checkout/datasources';
import {
  mapCoupon,
  mapShippingAddress,
  mapShippingArea,
} from '@data/checkout/mappers';

import { normalizeHttpError } from '@infrastructure/http';

class RepositoryFailure {
  protected failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }
}

export class HttpCouponRepository
  extends RepositoryFailure
  implements CouponRepository
{
  constructor(private readonly remote: CheckoutRemoteDataSource) {
    super();
  }

  async validate(code: string) {
    try {
      return ok(mapCoupon(await this.remote.validateCoupon(code)));
    } catch (error) {
      return this.failure(error);
    }
  }
}

export class HttpShippingAreaRepository
  extends RepositoryFailure
  implements ShippingAreaRepository
{
  constructor(private readonly remote: CheckoutRemoteDataSource) {
    super();
  }

  async list() {
    try {
      return ok((await this.remote.listAreas()).map(mapShippingArea));
    } catch (error) {
      return this.failure(error);
    }
  }
}

export class HttpCheckoutAddressRepository
  extends RepositoryFailure
  implements CheckoutAddressRepository
{
  constructor(private readonly remote: CheckoutRemoteDataSource) {
    super();
  }

  async list() {
    try {
      const [addresses, areas] = await Promise.all([
        this.remote.listAddresses(),
        this.remote.listAreas(),
      ]);
      return ok(addresses.map((address) => mapShippingAddress(address, areas)));
    } catch (error) {
      return this.failure(error);
    }
  }

  async save(input: import('@domain/checkout').NewShippingAddress) {
    try {
      const [address, areas] = await Promise.all([
        this.remote.saveAddress(input),
        this.remote.listAreas(),
      ]);
      return ok(mapShippingAddress(address, areas));
    } catch (error) {
      return this.failure(error);
    }
  }
}
