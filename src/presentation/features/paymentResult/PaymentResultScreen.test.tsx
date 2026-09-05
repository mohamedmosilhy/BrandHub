import { Money } from '@core/money';
import { ok } from '@core/result';

import {
  CheckPaymentStatusUseCase,
  type PaymentStatus,
  type WalletRepository,
} from '@domain/wallet';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import {
  PaymentResultScreen,
  type PaymentOutcome,
} from './PaymentResultScreen';

function repository(
  paymentStatus: jest.Mocked<WalletRepository>['paymentStatus'],
): jest.Mocked<WalletRepository> {
  return {
    get: jest.fn(async () =>
      ok({ balance: Money.fromDecimal(150.5), currency: 'OMR' as const }),
    ),
    transactions: jest.fn(async () => ok([])),
    charge: jest.fn(),
    paymentStatus,
    sendGift: jest.fn(),
    sentGifts: jest.fn(async () => ok([])),
  } as unknown as jest.Mocked<WalletRepository>;
}

async function mount({
  status,
  statuses = ['PAID'],
  gatewayOrderId = 'PAYMOB-ORDER-000001',
}: {
  status: PaymentOutcome;
  statuses?: PaymentStatus[];
  /** `null` models a return the app could not attribute to a charge. */
  gatewayOrderId?: string | null;
}) {
  let call = 0;
  const paymentStatus = jest.fn(async () =>
    ok(statuses[Math.min(call++, statuses.length - 1)] as PaymentStatus),
  ) as unknown as jest.Mocked<WalletRepository>['paymentStatus'];
  const wallet = repository(paymentStatus);
  const onBackToWallet = jest.fn();
  const onRetry = jest.fn();
  await renderWithProviders(
    <PaymentResultScreen
      status={status}
      amount="25.000"
      {...(gatewayOrderId ? { gatewayOrderId } : {})}
      checkPaymentStatus={new CheckPaymentStatusUseCase(wallet)}
      onBackToWallet={onBackToWallet}
      onRetry={onRetry}
    />,
  );
  return { wallet, onBackToWallet, onRetry };
}

describe('PaymentResultScreen', () => {
  it('AC10.6 — a success shows the success variant with the charged amount', async () => {
    await mount({ status: 'success' });

    await waitFor(() =>
      expect(screen.getByText('تم الدفع بنجاح')).toBeOnTheScreen(),
    );
    expect(screen.getByText('أُضيف المبلغ إلى محفظتك.')).toBeOnTheScreen();
    expect(screen.getByText('25.000')).toBeOnTheScreen();
    // AC10.7/AC10.8 — retry exists on failure and nowhere else.
    expect(screen.queryByLabelText('إعادة المحاولة')).not.toBeOnTheScreen();
  });

  it('AC10.7 — a failure shows the failure variant with a working retry', async () => {
    const { onRetry } = await mount({ status: 'failed' });

    await waitFor(() =>
      expect(screen.getByText('فشلت عملية الدفع')).toBeOnTheScreen(),
    );
    expect(
      screen.getByText('لم يتم خصم أي مبلغ. حاول مرة أخرى.'),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('إعادة المحاولة'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('AC10.8 — a pending charge shows the pending copy and no retry', async () => {
    await mount({ status: 'pending', statuses: ['PENDING'] });

    await waitFor(() =>
      expect(screen.getByText('الدفع قيد المعالجة')).toBeOnTheScreen(),
    );
    expect(
      screen.getByText('سنحدّث الحالة تلقائياً عند اكتمال العملية.'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('إعادة المحاولة')).not.toBeOnTheScreen();
  });

  it('AC10.13 — a pending charge resolves by polling, with no manual refresh', async () => {
    const { wallet } = await mount({
      status: 'pending',
      statuses: ['PENDING', 'PAID'],
    });

    await waitFor(() =>
      expect(screen.getByText('الدفع قيد المعالجة')).toBeOnTheScreen(),
    );
    await waitFor(
      () => expect(screen.getByText('تم الدفع بنجاح')).toBeOnTheScreen(),
      { timeout: 6_000 },
    );
    expect(wallet.paymentStatus).toHaveBeenCalledWith('PAYMOB-ORDER-000001');
  });

  it('resolves a pending charge the gateway then refuses', async () => {
    await mount({ status: 'pending', statuses: ['PENDING', 'FAILED'] });

    await waitFor(
      () => expect(screen.getByText('فشلت عملية الدفع')).toBeOnTheScreen(),
      { timeout: 6_000 },
    );
    expect(screen.getByLabelText('إعادة المحاولة')).toBeOnTheScreen();
  });

  it('stays pending, and never polls, when the return carried no gateway id', async () => {
    const { wallet } = await mount({
      status: 'pending',
      gatewayOrderId: null,
    });

    await waitFor(() =>
      expect(screen.getByText('الدفع قيد المعالجة')).toBeOnTheScreen(),
    );
    expect(wallet.paymentStatus).not.toHaveBeenCalled();
  });

  it('AC10.9 — back-to-wallet is offered on every variant', async () => {
    const { onBackToWallet } = await mount({ status: 'success' });

    await waitFor(() =>
      expect(screen.getByLabelText('العودة إلى المحفظة')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('العودة إلى المحفظة'));
    expect(onBackToWallet).toHaveBeenCalled();
  });
});
