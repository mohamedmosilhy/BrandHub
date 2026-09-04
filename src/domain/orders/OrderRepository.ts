import type { AppError } from '@core/errors';
import type { Result } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import type { CheckoutDraft } from '@domain/checkout';

import type { Order } from './entities';

export interface OrderRepository {
  place(
    draft: CheckoutDraft,
    idempotencyKey: IdempotencyKey,
  ): Promise<Result<Order, AppError>>;
  getById(id: string): Promise<Result<Order, AppError>>;
}
