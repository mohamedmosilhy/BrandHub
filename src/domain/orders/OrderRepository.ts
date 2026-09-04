import type { AppError } from '@core/errors';
import type { Result } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import type { CheckoutDraft } from '@domain/checkout';

import type { Order, ReturnReason, ReturnRequest } from './entities';

export interface OrderRepository {
  place(
    draft: CheckoutDraft,
    idempotencyKey: IdempotencyKey,
  ): Promise<Result<Order, AppError>>;
  getById(id: string): Promise<Result<Order, AppError>>;
  list(
    page?: number,
    size?: number,
  ): Promise<Result<readonly Order[], AppError>>;
  /**
   * The five fixed UI reasons are mapped to the API's free-text `reason` in the data layer
   * (D19), so the port stays typed and the contract's shape stays in the mapper.
   */
  requestReturn(
    orderId: string,
    reason: ReturnReason,
    note?: string,
  ): Promise<Result<ReturnRequest, AppError>>;
}
