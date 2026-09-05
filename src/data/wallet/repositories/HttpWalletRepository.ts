import { isAppError } from '@core/errors';
import type { Money } from '@core/money';
import { err, ok } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import {
  DEFAULT_PAGE_SIZE,
  type GiftInput,
  type WalletRepository,
} from '@domain/wallet';

import type { WalletRemoteDataSource } from '@data/wallet/datasources';
import {
  mapGift,
  mapPaymentStatus,
  mapWallet,
  mapWalletCharge,
  mapWalletTransaction,
} from '@data/wallet/mappers';

import { normalizeHttpError } from '@infrastructure/http';

/** HTTP from the start (D19): the wallet, gifts and the payment status are all contracted. */
export class HttpWalletRepository implements WalletRepository {
  constructor(private readonly remote: WalletRemoteDataSource) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async get() {
    try {
      return ok(mapWallet(await this.remote.get()));
    } catch (error) {
      return this.failure(error);
    }
  }

  async transactions(page = 0, size = DEFAULT_PAGE_SIZE) {
    try {
      const rows = await this.remote.transactions(page, size);
      return ok(rows.map(mapWalletTransaction));
    } catch (error) {
      return this.failure(error);
    }
  }

  async charge(amount: Money, idempotencyKey: IdempotencyKey) {
    try {
      return ok(
        mapWalletCharge(await this.remote.charge(amount, idempotencyKey)),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async paymentStatus(gatewayOrderId: string) {
    try {
      return ok(
        mapPaymentStatus(await this.remote.paymentStatus(gatewayOrderId)),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async sendGift(input: GiftInput) {
    try {
      return ok(mapGift(await this.remote.sendGift(input)));
    } catch (error) {
      return this.failure(error);
    }
  }

  async sentGifts() {
    try {
      const gifts = await this.remote.sentGifts();
      return ok(gifts.map(mapGift));
    } catch (error) {
      return this.failure(error);
    }
  }
}
