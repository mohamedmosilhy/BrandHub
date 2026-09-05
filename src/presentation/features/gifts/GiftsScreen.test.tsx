import { ServerError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';

import {
  GetSentGiftsUseCase,
  SendGiftUseCase,
  type Gift,
  type GiftInput,
  type WalletRepository,
} from '@domain/wallet';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { GiftsScreen } from './GiftsScreen';

function buildGift(overrides: Partial<Gift> = {}): Gift {
  return {
    id: 'gift-1',
    recipient: 'huda@brandhub.om',
    amount: Money.fromDecimal(10),
    occasion: 'BIRTHDAY',
    message: 'كل عام وأنت بخير',
    status: 'SENT',
    createdAt: '2026-08-14T10:00:00.000Z',
    ...overrides,
  };
}

/** Stateful: a sent gift has to appear in the history and the balance has to fall. */
function repository(
  overrides: Partial<WalletRepository> = {},
): jest.Mocked<WalletRepository> {
  let balance = Money.fromDecimal(125.5);
  let gifts: Gift[] = [buildGift()];
  return {
    get: jest.fn(async () => ok({ balance, currency: 'OMR' as const })),
    transactions: jest.fn(async () => ok([])),
    charge: jest.fn(),
    paymentStatus: jest.fn(),
    sendGift: jest.fn(async (input: GiftInput) => {
      balance = balance.minus(input.amount);
      const sent = buildGift({
        id: `gift-${gifts.length + 1}`,
        recipient: input.recipient,
        amount: input.amount,
        occasion: input.occasion,
      });
      gifts = [sent, ...gifts];
      return ok(sent);
    }),
    sentGifts: jest.fn(async () => ok(gifts)),
    ...overrides,
  } as unknown as jest.Mocked<WalletRepository>;
}

async function mount(wallet = repository()) {
  await renderWithProviders(
    <GiftsScreen
      sendGift={new SendGiftUseCase(wallet)}
      getSentGifts={new GetSentGiftsUseCase(wallet)}
      onBack={jest.fn()}
    />,
  );
  return { wallet };
}

async function type(label: string, value: string) {
  fireEvent.changeText(screen.getByLabelText(label), value);
  await waitFor(() =>
    expect(screen.getByLabelText(label).props['value']).toBe(value),
  );
}

describe('GiftsScreen', () => {
  it('offers the prototype’s four occasions, with birthday selected first', async () => {
    await mount();

    for (const label of ['عيد ميلاد', 'عيد', 'تخرّج', 'شكراً'])
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    expect(
      screen.getByLabelText('عيد ميلاد').props['accessibilityState'].selected,
    ).toBe(true);
  });

  it('AC10.10 — sends the full contracted payload and shows the gift in the history', async () => {
    const { wallet } = await mount();

    await type('المستلم (بريد أو هاتف)', 'friend@brandhub.om');
    await type('المبلغ', '10.000');
    fireEvent.press(screen.getByLabelText('تخرّج'));
    await waitFor(() =>
      expect(
        screen.getByLabelText('تخرّج').props['accessibilityState'].selected,
      ).toBe(true),
    );
    await type('رسالتك', 'مبروك');
    fireEvent.press(screen.getByLabelText('إرسال الهدية'));

    await waitFor(() =>
      expect(wallet.sendGift).toHaveBeenCalledWith({
        recipient: 'friend@brandhub.om',
        amount: Money.fromDecimal(10),
        currency: 'OMR',
        occasion: 'GRADUATION',
        message: 'مبروك',
        deliveryMethod: 'EMAIL',
        senderMode: 'NAMED',
        scheduledAt: null,
      }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('friend@brandhub.om')).toBeOnTheScreen(),
    );
    // The form is cleared, so a second tap cannot send the same gift again.
    await waitFor(() =>
      expect(screen.getByLabelText('المبلغ').props['value']).toBe(''),
    );
  });

  it('names SMS delivery for an Omani number', async () => {
    const { wallet } = await mount();

    await type('المستلم (بريد أو هاتف)', '+96899112233');
    await type('المبلغ', '5.000');
    fireEvent.press(screen.getByLabelText('إرسال الهدية'));

    await waitFor(() =>
      expect(wallet.sendGift).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: '+96899112233',
          deliveryMethod: 'SMS',
        }),
      ),
    );
  });

  it('AC10.11 — blocks a gift larger than the balance with a message', async () => {
    const { wallet } = await mount();

    await type('المستلم (بريد أو هاتف)', 'friend@brandhub.om');
    await type('المبلغ', '500.000');
    fireEvent.press(screen.getByLabelText('إرسال الهدية'));

    await waitFor(() =>
      expect(screen.getByText('المبلغ أكبر من رصيد محفظتك')).toBeOnTheScreen(),
    );
    expect(wallet.sendGift).not.toHaveBeenCalled();
  });

  it('names an unusable recipient rather than sending it', async () => {
    const { wallet } = await mount();

    await type('المستلم (بريد أو هاتف)', 'nope');
    await type('المبلغ', '5.000');
    fireEvent.press(screen.getByLabelText('إرسال الهدية'));

    await waitFor(() =>
      expect(
        screen.getByText('أدخل بريداً إلكترونياً أو رقماً عُمانياً'),
      ).toBeOnTheScreen(),
    );
    expect(wallet.sendGift).not.toHaveBeenCalled();
  });

  it('offers a retry when the gift history cannot be read', async () => {
    const { wallet } = await mount(
      repository({
        sentGifts: jest.fn(async () =>
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
    await waitFor(() => expect(wallet.sentGifts).toHaveBeenCalledTimes(2));
  });
});
