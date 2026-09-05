import { NetworkError, ServerError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';
import type { IdempotencyKey } from '@core/types';

import {
  CheckPaymentStatusUseCase,
  isCredit,
  parseAmount,
  resolveGiftRecipient,
  SendGiftUseCase,
  TOP_UP_MAXIMUM,
  TOP_UP_MINIMUM,
  TopUpWalletUseCase,
  transactionSign,
  type Gift,
  type GiftDraft,
  type TransactionType,
  type WalletCharge,
  type WalletRepository,
} from '@domain/wallet';

const charge: WalletCharge = {
  id: 'charge-1',
  amount: Money.fromDecimal(25),
  status: 'PENDING',
  paymentUrl: 'https://paymob.example/checkout/1',
  referenceId: 'PAYMOB-REF-000001',
  gatewayOrderId: 'PAYMOB-ORDER-000001',
};

const gift: Gift = {
  id: 'gift-1',
  recipient: 'friend@brandhub.om',
  amount: Money.fromDecimal(10),
  occasion: 'BIRTHDAY',
  message: 'Happy birthday',
  status: 'SENT',
  createdAt: '2026-09-02T12:00:00.000Z',
};

const draft: GiftDraft = {
  recipient: 'friend@brandhub.om',
  amount: '10.000',
  occasion: 'BIRTHDAY',
  message: '  Happy birthday  ',
};

function repository(
  overrides: Partial<WalletRepository> = {},
): jest.Mocked<WalletRepository> {
  return {
    get: jest.fn(async () =>
      ok({ balance: Money.fromDecimal(125.5), currency: 'OMR' as const }),
    ),
    transactions: jest.fn(async () => ok([])),
    charge: jest.fn(async () => ok(charge)),
    paymentStatus: jest.fn(async () => ok('PAID' as const)),
    sendGift: jest.fn(async () => ok(gift)),
    sentGifts: jest.fn(async () => ok([gift])),
    ...overrides,
  } as unknown as jest.Mocked<WalletRepository>;
}

describe('transaction sign', () => {
  it('treats money arriving as a credit and money leaving as a debit', () => {
    const credits: TransactionType[] = [
      'CREDIT',
      'REFUND',
      'GIFT_RECEIVED',
      'TRANSFER_IN',
    ];
    const debits: TransactionType[] = ['PURCHASE', 'GIFT_SENT', 'TRANSFER_OUT'];
    for (const type of credits) {
      expect(transactionSign(type)).toBe(1);
      expect(isCredit(type)).toBe(true);
    }
    for (const type of debits) {
      expect(transactionSign(type)).toBe(-1);
      expect(isCredit(type)).toBe(false);
    }
  });

  it('reads an unrecognised type as a debit — the safe reading of an unknown movement', () => {
    expect(transactionSign('UNKNOWN')).toBe(-1);
  });
});

describe('parseAmount', () => {
  it('accepts what the amount field can plausibly contain', () => {
    expect(parseAmount('25').ok && parseAmount('25')).toEqual(
      ok(Money.fromDecimal(25)),
    );
    expect(parseAmount(' 25.500 ')).toEqual(ok(Money.fromDecimal(25.5)));
    // A comma decimal separator and Arabic-Indic digits both reach this field in practice.
    expect(parseAmount('25,500')).toEqual(ok(Money.fromDecimal(25.5)));
    expect(parseAmount('٢٥')).toEqual(ok(Money.fromDecimal(25)));
  });

  it('refuses anything that is not an OMR amount', () => {
    for (const value of ['', 'abc', '25.5000', '-5', '1e3'])
      expect(parseAmount(value).ok).toBe(false);
  });
});

describe('TopUpWalletUseCase', () => {
  it('AC10.4 — blocks an amount below the minimum or above the maximum', async () => {
    const wallet = repository();
    const useCase = new TopUpWalletUseCase(wallet);

    const low = await useCase.execute(
      Money.fromBaisa(TOP_UP_MINIMUM.baisa - 1),
    );
    const high = await useCase.execute(
      Money.fromBaisa(TOP_UP_MAXIMUM.baisa + 1),
    );

    expect(low.ok || low.error.code).toBe('AMOUNT_BELOW_MINIMUM');
    expect(high.ok || high.error.code).toBe('AMOUNT_ABOVE_MAXIMUM');
    expect(wallet.charge).not.toHaveBeenCalled();
  });

  it('accepts both boundaries themselves', async () => {
    const wallet = repository();
    const useCase = new TopUpWalletUseCase(wallet);

    expect((await useCase.execute(TOP_UP_MINIMUM)).ok).toBe(true);
    expect((await useCase.execute(TOP_UP_MAXIMUM)).ok).toBe(true);
  });

  it('AC10.14 — a retry after a lost connection reuses the attempt’s key', async () => {
    const keys = ['key-1', 'key-2'] as IdempotencyKey[];
    let issued = 0;
    const wallet = repository({
      charge: jest
        .fn()
        .mockResolvedValueOnce(
          err(
            new NetworkError({
              code: 'NETWORK',
              message: 'lost',
              correlationId: 'cor-wallet',
            }),
          ),
        )
        .mockResolvedValueOnce(ok(charge)),
    });
    const useCase = new TopUpWalletUseCase(
      wallet,
      () => keys[issued++] as IdempotencyKey,
    );

    await useCase.execute(Money.fromDecimal(25));
    await useCase.execute(Money.fromDecimal(25));

    expect(wallet.charge).toHaveBeenNthCalledWith(
      1,
      Money.fromDecimal(25),
      'key-1',
    );
    expect(wallet.charge).toHaveBeenNthCalledWith(
      2,
      Money.fromDecimal(25),
      'key-1',
    );
  });

  it('mints a new key once the amount changes — that is a different intent', async () => {
    const keys = ['key-1', 'key-2'] as IdempotencyKey[];
    let issued = 0;
    const wallet = repository({
      charge: jest.fn(async () =>
        err(
          new NetworkError({
            code: 'NETWORK',
            message: 'lost',
            correlationId: 'cor-wallet',
          }),
        ),
      ),
    });
    const useCase = new TopUpWalletUseCase(
      wallet,
      () => keys[issued++] as IdempotencyKey,
    );

    await useCase.execute(Money.fromDecimal(25));
    await useCase.execute(Money.fromDecimal(50));

    expect(wallet.charge).toHaveBeenNthCalledWith(
      2,
      Money.fromDecimal(50),
      'key-2',
    );
  });

  it('does not reuse a key after a definite failure', async () => {
    const keys = ['key-1', 'key-2'] as IdempotencyKey[];
    let issued = 0;
    const wallet = repository({
      charge: jest.fn(async () =>
        err(
          new ServerError(500, {
            code: 'SERVER',
            message: 'boom',
            correlationId: 'cor-wallet',
          }),
        ),
      ),
    });
    const useCase = new TopUpWalletUseCase(
      wallet,
      () => keys[issued++] as IdempotencyKey,
    );

    await useCase.execute(Money.fromDecimal(25));
    await useCase.execute(Money.fromDecimal(25));

    expect(wallet.charge).toHaveBeenNthCalledWith(
      2,
      Money.fromDecimal(25),
      'key-2',
    );
  });
});

describe('resolveGiftRecipient', () => {
  it('accepts an email and names EMAIL delivery', () => {
    expect(resolveGiftRecipient('  Friend@BrandHub.om ')).toEqual(
      ok({ recipient: 'friend@brandhub.om', deliveryMethod: 'EMAIL' }),
    );
  });

  it('accepts an Omani number and names SMS delivery', () => {
    expect(resolveGiftRecipient('+968 9911 2233')).toEqual(
      ok({ recipient: '+96899112233', deliveryMethod: 'SMS' }),
    );
  });

  it('refuses anything that is neither', () => {
    for (const value of ['', 'friend', '99112233', '+12025550123'])
      expect(resolveGiftRecipient(value).ok).toBe(false);
  });
});

describe('SendGiftUseCase', () => {
  it('AC10.10 — posts the full contracted payload, currency included', async () => {
    const wallet = repository();
    const result = await new SendGiftUseCase(wallet).execute(draft);

    expect(result).toEqual(ok(gift));
    expect(wallet.sendGift).toHaveBeenCalledWith({
      recipient: 'friend@brandhub.om',
      amount: Money.fromDecimal(10),
      currency: 'OMR',
      occasion: 'BIRTHDAY',
      message: 'Happy birthday',
      deliveryMethod: 'EMAIL',
      senderMode: 'NAMED',
      scheduledAt: null,
    });
  });

  it('names SMS delivery when the recipient is a phone number', async () => {
    const wallet = repository();
    await new SendGiftUseCase(wallet).execute({
      ...draft,
      recipient: '+96899112233',
    });

    expect(wallet.sendGift).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryMethod: 'SMS' }),
    );
  });

  it('AC10.11 — blocks a gift larger than the balance, read back from the repository', async () => {
    const wallet = repository({
      get: jest.fn(async () =>
        ok({ balance: Money.fromDecimal(5), currency: 'OMR' as const }),
      ),
    });
    const result = await new SendGiftUseCase(wallet).execute(draft);

    expect(result.ok || result.error.code).toBe('INSUFFICIENT_BALANCE');
    expect(wallet.sendGift).not.toHaveBeenCalled();
  });

  it('blocks an invalid recipient or amount before reading the balance', async () => {
    const wallet = repository();
    const badRecipient = await new SendGiftUseCase(wallet).execute({
      ...draft,
      recipient: 'nope',
    });
    const badAmount = await new SendGiftUseCase(wallet).execute({
      ...draft,
      amount: '',
    });

    expect(badRecipient.ok || badRecipient.error.code).toBe(
      'INVALID_RECIPIENT',
    );
    expect(badAmount.ok || badAmount.error.code).toBe('INVALID_AMOUNT');
    expect(wallet.get).not.toHaveBeenCalled();
  });
});

describe('CheckPaymentStatusUseCase', () => {
  it('asks the gateway about the charge the app is waiting on', async () => {
    const wallet = repository();
    const result = await new CheckPaymentStatusUseCase(wallet).execute(
      'PAYMOB-ORDER-000001',
    );

    expect(result).toEqual(ok('PAID'));
    expect(wallet.paymentStatus).toHaveBeenCalledWith('PAYMOB-ORDER-000001');
  });
});
