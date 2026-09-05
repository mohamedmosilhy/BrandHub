import { z } from 'zod';

import type { Money } from '@core/money';
import type { IdempotencyKey } from '@core/types';

import type { GiftInput } from '@domain/wallet';

import { parseResponse } from '@data/shared';
import {
  giftDtoSchema,
  paymentStatusDtoSchema,
  walletChargeDtoSchema,
  walletDtoSchema,
  walletTransactionPageDtoSchema,
  type GiftDto,
  type WalletChargeDto,
  type WalletDto,
  type WalletTransactionDto,
} from '@data/wallet/dto';

import type { HttpClient } from '@infrastructure/http';

export class WalletRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async get(): Promise<WalletDto> {
    const endpoint = '/wallet';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      walletDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async transactions(
    page: number,
    size: number,
  ): Promise<readonly WalletTransactionDto[]> {
    const endpoint = '/wallet/transactions';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page, size },
    });
    return parseResponse(
      walletTransactionPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).content;
  }

  /**
   * The contracted body is `{ amount, paymentMethod }`. The `Idempotency-Key` rides on the
   * request, not in it (D20), so a retry after a lost response cannot charge twice.
   */
  async charge(
    amount: Money,
    idempotencyKey: IdempotencyKey,
  ): Promise<WalletChargeDto> {
    const endpoint = '/wallet/charge';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      idempotencyKey,
      body: { amount: amount.toDecimal(), paymentMethod: 'PAYMOB' },
    });
    return parseResponse(
      walletChargeDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async paymentStatus(gatewayOrderId: string): Promise<string> {
    const endpoint = '/payments/PAYMOB/status';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { orderId: gatewayOrderId },
    });
    return parseResponse(
      paymentStatusDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).status;
  }

  /** The full contracted payload, `currency: "OMR"` included (D19). */
  async sendGift(input: GiftInput): Promise<GiftDto> {
    const endpoint = '/gifts';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: {
        recipient: input.recipient,
        amount: input.amount.toDecimal(),
        currency: input.currency,
        occasion: input.occasion,
        message: input.message,
        deliveryMethod: input.deliveryMethod,
        senderMode: input.senderMode,
        scheduledAt: input.scheduledAt,
      },
    });
    return parseResponse(
      giftDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async sentGifts(): Promise<readonly GiftDto[]> {
    const endpoint = '/gifts/sent';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      z.array(giftDtoSchema),
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
