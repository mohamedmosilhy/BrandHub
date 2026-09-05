/** @jest-environment node */

import { NotFoundError } from '@core/errors';
import { Money } from '@core/money';
import type { IdempotencyKey } from '@core/types';

import type {
  GiftDto,
  WalletChargeDto,
  WalletTransactionDto,
} from '@data/wallet/dto';

import type {
  HttpClient,
  HttpResponse,
  RequestConfig,
} from '@infrastructure/http';

import { WalletRemoteDataSource } from '../datasources';

import { HttpWalletRepository } from './HttpWalletRepository';

function transactionDto(
  overrides: Partial<WalletTransactionDto> = {},
): WalletTransactionDto {
  return {
    id: 'wallet-transaction-1',
    userId: 'user-customer',
    type: 'CREDIT',
    amount: 50,
    currency: 'OMR',
    description: 'Wallet top-up',
    createdAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  };
}

const chargeDto: WalletChargeDto = {
  id: 'charge-1',
  amount: 25,
  currency: 'OMR',
  status: 'PENDING',
  gateway: 'PAYMOB',
  paymentUrl: 'https://paymob.example/checkout/1',
  referenceId: 'PAYMOB-REF-000001',
  gatewayOrderId: 'PAYMOB-ORDER-000001',
  createdAt: '2026-09-02T12:00:00.000Z',
};

const giftDto: GiftDto = {
  id: 'gift-1',
  senderId: 'user-customer',
  recipient: 'friend@brandhub.om',
  amount: 10,
  currency: 'OMR',
  occasion: 'BIRTHDAY',
  message: 'Happy birthday',
  deliveryMethod: 'EMAIL',
  senderMode: 'NAMED',
  scheduledAt: null,
  status: 'SENT',
  createdAt: '2026-09-02T12:00:00.000Z',
};

const page = (content: WalletTransactionDto[]) => ({
  content,
  number: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
});

class FakeHttpClient implements HttpClient {
  readonly requests: RequestConfig[] = [];
  responder: (config: RequestConfig) => unknown = () => undefined;

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    this.requests.push(config);
    return {
      data: this.responder(config) as T,
      status: 200,
      headers: {},
      correlationId: 'cor-wallet',
    };
  }
}

function fixture() {
  const http = new FakeHttpClient();
  const repository = new HttpWalletRepository(new WalletRemoteDataSource(http));
  return { http, repository };
}

describe('HttpWalletRepository.get', () => {
  it('maps the balance into Money so no float arithmetic touches it', async () => {
    const { repository, http } = fixture();
    http.responder = () => ({
      userId: 'user-customer',
      balance: 125.5,
      currency: 'OMR',
    });

    const result = await repository.get();

    expect(result.ok && result.value.balance.baisa).toBe(125_500);
    expect(http.requests[0]).toMatchObject({
      method: 'GET',
      endpoint: '/wallet',
    });
  });
});

describe('HttpWalletRepository.transactions', () => {
  it('maps the page and narrows a type it has never met', async () => {
    const { repository, http } = fixture();
    http.responder = () =>
      page([
        transactionDto(),
        transactionDto({ id: 'wallet-transaction-2', type: 'PURCHASE' }),
        transactionDto({ id: 'wallet-transaction-3', type: 'SELLER_PAYOUT' }),
      ]);

    const result = await repository.transactions();

    expect(http.requests[0]).toMatchObject({
      endpoint: '/wallet/transactions',
      query: { page: 0, size: 20 },
    });
    expect(result.ok && result.value.map((row) => row.type)).toEqual([
      'CREDIT',
      'PURCHASE',
      'UNKNOWN',
    ]);
  });

  it('takes the magnitude, so the sign is the type’s and never doubled', async () => {
    const { repository, http } = fixture();
    http.responder = () =>
      page([transactionDto({ type: 'PURCHASE', amount: -64.2 })]);

    const result = await repository.transactions();

    expect(result.ok && result.value[0]?.amount.baisa).toBe(64_200);
  });
});

describe('HttpWalletRepository.charge', () => {
  it('posts the contracted body and carries the Idempotency-Key on the request (D20)', async () => {
    const { repository, http } = fixture();
    http.responder = () => chargeDto;

    const result = await repository.charge(
      Money.fromDecimal(25),
      'key-1' as IdempotencyKey,
    );

    expect(http.requests[0]).toMatchObject({
      method: 'POST',
      endpoint: '/wallet/charge',
      idempotencyKey: 'key-1',
      body: { amount: 25, paymentMethod: 'PAYMOB' },
    });
    expect(result.ok && result.value).toMatchObject({
      status: 'PENDING',
      paymentUrl: 'https://paymob.example/checkout/1',
      gatewayOrderId: 'PAYMOB-ORDER-000001',
    });
  });

  it('fails loudly when the charge carries no key to poll a status with', async () => {
    const { repository, http } = fixture();
    const { gatewayOrderId: _dropped, ...withoutKey } = chargeDto;
    http.responder = () => withoutKey;

    expect(
      (await repository.charge(Money.fromDecimal(25), 'k' as IdempotencyKey))
        .ok,
    ).toBe(false);
  });
});

describe('HttpWalletRepository.paymentStatus', () => {
  it('asks about the gateway order id and normalises the gateway’s wording', async () => {
    const { repository, http } = fixture();
    http.responder = (config) => ({
      orderId: String(config.query?.['orderId']),
      status: 'success',
    });

    const result = await repository.paymentStatus('PAYMOB-ORDER-000001');

    expect(http.requests[0]).toMatchObject({
      endpoint: '/payments/PAYMOB/status',
      query: { orderId: 'PAYMOB-ORDER-000001' },
    });
    expect(result).toEqual({ ok: true, value: 'PAID' });
  });

  it('reads a status it does not recognise as UNKNOWN rather than as settled', async () => {
    const { repository, http } = fixture();
    http.responder = () => ({ orderId: 'x', status: 'CHARGEBACK' });

    expect(await repository.paymentStatus('x')).toEqual({
      ok: true,
      value: 'UNKNOWN',
    });
  });
});

describe('HttpWalletRepository.sendGift', () => {
  it('AC10.10 — posts every contracted field, currency included', async () => {
    const { repository, http } = fixture();
    http.responder = () => giftDto;

    await repository.sendGift({
      recipient: 'friend@brandhub.om',
      amount: Money.fromDecimal(10),
      currency: 'OMR',
      occasion: 'BIRTHDAY',
      message: 'Happy birthday',
      deliveryMethod: 'EMAIL',
      senderMode: 'NAMED',
      scheduledAt: null,
    });

    expect(http.requests[0]).toMatchObject({
      method: 'POST',
      endpoint: '/gifts',
    });
    expect(http.requests[0]?.body).toEqual({
      recipient: 'friend@brandhub.om',
      amount: 10,
      currency: 'OMR',
      occasion: 'BIRTHDAY',
      message: 'Happy birthday',
      deliveryMethod: 'EMAIL',
      senderMode: 'NAMED',
      scheduledAt: null,
    });
  });

  it('returns the API failure rather than throwing it at the screen', async () => {
    const { repository, http } = fixture();
    const notFound = new NotFoundError({
      code: 'RECIPIENT_NOT_FOUND',
      message: 'Recipient was not found',
      correlationId: 'cor-wallet',
    });
    http.responder = () => {
      throw notFound;
    };

    const result = await repository.sentGifts();

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toBe(notFound);
  });
});
