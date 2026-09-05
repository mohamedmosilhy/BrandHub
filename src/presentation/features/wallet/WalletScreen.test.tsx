import { NetworkError, ServerError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';

import {
  GetTransactionsUseCase,
  GetWalletUseCase,
  TopUpWalletUseCase,
  type WalletCharge,
  type WalletRepository,
  type WalletTransaction,
} from '@domain/wallet';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { WalletScreen } from './WalletScreen';

const charge: WalletCharge = {
  id: 'charge-1',
  amount: Money.fromDecimal(25),
  status: 'PENDING',
  paymentUrl: 'https://paymob.example/checkout/1',
  referenceId: 'PAYMOB-REF-000001',
  gatewayOrderId: 'PAYMOB-ORDER-000001',
};

function transaction(
  overrides: Partial<WalletTransaction> = {},
): WalletTransaction {
  return {
    id: 'wallet-transaction-1',
    type: 'CREDIT',
    amount: Money.fromDecimal(50),
    description: 'شحن رصيد',
    createdAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  };
}

function repository(
  overrides: Partial<WalletRepository> = {},
): jest.Mocked<WalletRepository> {
  return {
    get: jest.fn(async () =>
      ok({ balance: Money.fromDecimal(125.5), currency: 'OMR' as const }),
    ),
    transactions: jest.fn(async () =>
      ok([
        transaction(),
        transaction({
          id: 'wallet-transaction-2',
          type: 'PURCHASE',
          amount: Money.fromDecimal(64.2),
          description: 'طلب BH-283740',
        }),
      ]),
    ),
    charge: jest.fn(async () => ok(charge)),
    paymentStatus: jest.fn(async () => ok('PAID' as const)),
    sendGift: jest.fn(),
    sentGifts: jest.fn(async () => ok([])),
    ...overrides,
  } as unknown as jest.Mocked<WalletRepository>;
}

async function mount(wallet = repository()) {
  const onCharge = jest.fn();
  await renderWithProviders(
    <WalletScreen
      getWallet={new GetWalletUseCase(wallet)}
      getTransactions={new GetTransactionsUseCase(wallet)}
      topUpWallet={new TopUpWalletUseCase(wallet)}
      onBack={jest.fn()}
      onCharge={onCharge}
    />,
  );
  return { wallet, onCharge };
}

const selected = (label: string) =>
  screen.getByLabelText(label).props['accessibilityState'].selected;

describe('WalletScreen — the balance card', () => {
  it('AC10.1 — shows the balance as NN.NNN with the OMR label', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('125.500 ر.ع.')).toBeOnTheScreen(),
    );
    expect(screen.getByText('المحفظة مفعّلة')).toBeOnTheScreen();
  });
});

describe('WalletScreen — the transaction history', () => {
  it('AC10.2 — signs a credit and a debit the reference’s way', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('+50.000 ر.ع.')).toBeOnTheScreen(),
    );
    expect(screen.getByLabelText('−64.200 ر.ع.')).toBeOnTheScreen();
  });

  it('shows the empty state for an account that has moved no money', async () => {
    await mount(repository({ transactions: jest.fn(async () => ok([])) }));

    await waitFor(() =>
      expect(screen.getByText('لا توجد عمليات حتى الآن')).toBeOnTheScreen(),
    );
  });

  it('offers a retry when the history cannot be read', async () => {
    const { wallet } = await mount(
      repository({
        transactions: jest.fn(async () =>
          err(
            new ServerError(503, {
              code: 'SERVER',
              message: 'down',
              correlationId: 'cor-wallet',
            }),
          ),
        ),
      }),
    );

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await waitFor(() => expect(wallet.transactions).toHaveBeenCalledTimes(2));
  });
});

describe('WalletScreen — top-up', () => {
  it('AC10.3 — a quick amount marks itself and clears the custom field', async () => {
    await mount();

    fireEvent.changeText(screen.getByLabelText('مبلغ آخر'), '33.000');
    await waitFor(() =>
      expect(screen.getByLabelText('مبلغ آخر').props['value']).toBe('33.000'),
    );
    fireEvent.press(screen.getByLabelText('25.000'));

    await waitFor(() => expect(selected('25.000')).toBe(true));
    expect(screen.getByLabelText('مبلغ آخر').props['value']).toBe('');
  });

  it('a custom amount clears the quick selection — the two are exclusive', async () => {
    await mount();

    fireEvent.press(screen.getByLabelText('25.000'));
    await waitFor(() => expect(selected('25.000')).toBe(true));
    fireEvent.changeText(screen.getByLabelText('مبلغ آخر'), '33.000');

    await waitFor(() => expect(selected('25.000')).toBe(false));
  });

  it('AC10.5 — a charge is produced and handed on; no card field exists on this screen', async () => {
    const { wallet, onCharge } = await mount();

    fireEvent.press(screen.getByLabelText('25.000'));
    await waitFor(() => expect(selected('25.000')).toBe(true));
    fireEvent.press(screen.getByLabelText('الشحن عبر Paymob'));

    await waitFor(() => expect(onCharge).toHaveBeenCalledWith(charge));
    expect(wallet.charge).toHaveBeenCalledWith(
      Money.fromDecimal(25),
      expect.any(String),
    );
    // The prototype's wallet has no card number, expiry or CVC — and neither does this.
    expect(screen.queryByLabelText('رقم البطاقة')).not.toBeOnTheScreen();
    expect(
      screen.getByText('يتم الدفع على صفحة Paymob الآمنة خارج التطبيق.'),
    ).toBeOnTheScreen();
  });

  it('AC10.4 — blocks an amount below the minimum with a message', async () => {
    const { wallet, onCharge } = await mount();

    fireEvent.changeText(screen.getByLabelText('مبلغ آخر'), '0.500');
    await waitFor(() =>
      expect(screen.getByLabelText('مبلغ آخر').props['value']).toBe('0.500'),
    );
    fireEvent.press(screen.getByLabelText('الشحن عبر Paymob'));

    await waitFor(() =>
      expect(
        screen.getByText('أقل مبلغ للشحن هو 1.000 ر.ع.'),
      ).toBeOnTheScreen(),
    );
    expect(wallet.charge).not.toHaveBeenCalled();
    expect(onCharge).not.toHaveBeenCalled();
  });

  it('AC10.4 — blocks an amount above the maximum with a message', async () => {
    const { onCharge } = await mount();

    fireEvent.changeText(screen.getByLabelText('مبلغ آخر'), '501.000');
    await waitFor(() =>
      expect(screen.getByLabelText('مبلغ آخر').props['value']).toBe('501.000'),
    );
    fireEvent.press(screen.getByLabelText('الشحن عبر Paymob'));

    await waitFor(() =>
      expect(
        screen.getByText('أعلى مبلغ للشحن هو 500.000 ر.ع.'),
      ).toBeOnTheScreen(),
    );
    expect(onCharge).not.toHaveBeenCalled();
  });

  it('refuses to charge nothing at all', async () => {
    const { wallet } = await mount();

    fireEvent.press(screen.getByLabelText('الشحن عبر Paymob'));

    await waitFor(() =>
      expect(screen.getByText('أدخل مبلغاً مثل 25.000')).toBeOnTheScreen(),
    );
    expect(wallet.charge).not.toHaveBeenCalled();
  });

  it('reports a charge the network lost without pretending it succeeded', async () => {
    const { onCharge } = await mount(
      repository({
        charge: jest.fn(async () =>
          err(
            new NetworkError({
              code: 'NETWORK',
              message: 'lost',
              correlationId: 'cor-wallet',
            }),
          ),
        ),
      }),
    );

    fireEvent.press(screen.getByLabelText('25.000'));
    await waitFor(() => expect(selected('25.000')).toBe(true));
    fireEvent.press(screen.getByLabelText('الشحن عبر Paymob'));

    await waitFor(() =>
      expect(
        screen.getByText('تعذّر بدء عملية الشحن. حاول مرة أخرى.'),
      ).toBeOnTheScreen(),
    );
    expect(onCharge).not.toHaveBeenCalled();
  });
});
