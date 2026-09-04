import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import type { CheckoutDraft } from '@domain/checkout';
import type { OrderRepository } from '@domain/orders';

import type { AssetUrlResolver } from '@data/catalog/mappers';
import type { OrderRemoteDataSource } from '@data/orders/datasources';
import { mapOrder } from '@data/orders/mappers';

import { normalizeHttpError } from '@infrastructure/http';

export class HttpOrderRepository implements OrderRepository {
  constructor(
    private readonly remote: OrderRemoteDataSource,
    private readonly resolveUrl?: AssetUrlResolver,
  ) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async place(draft: CheckoutDraft, idempotencyKey: IdempotencyKey) {
    try {
      return ok(
        mapOrder(
          await this.remote.place(draft, idempotencyKey),
          this.resolveUrl,
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async getById(id: string) {
    try {
      return ok(mapOrder(await this.remote.getById(id), this.resolveUrl));
    } catch (error) {
      return this.failure(error);
    }
  }
}
