import type { AppError } from '@core/errors';
import type { Money } from '@core/money';
import type { Result } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import type {
  Gift,
  GiftInput,
  PaymentStatus,
  Wallet,
  WalletCharge,
  WalletTransaction,
} from './entities';

/**
 * One port for the whole wallet resource, as `architecture.md` §13 lists it. Gifts live here
 * rather than behind a second port because a gift **is** a wallet movement — it debits the same
 * balance and writes the same history — and splitting it would let two ports disagree about that.
 */
export interface WalletRepository {
  get(): Promise<Result<Wallet, AppError>>;
  transactions(
    page?: number,
    size?: number,
  ): Promise<Result<readonly WalletTransaction[], AppError>>;
  charge(
    amount: Money,
    idempotencyKey: IdempotencyKey,
  ): Promise<Result<WalletCharge, AppError>>;
  /** Resolves a hosted payment by the gateway's own order id. */
  paymentStatus(
    gatewayOrderId: string,
  ): Promise<Result<PaymentStatus, AppError>>;
  sendGift(input: GiftInput): Promise<Result<Gift, AppError>>;
  sentGifts(): Promise<Result<readonly Gift[], AppError>>;
}
