import { NetworkError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';

import {
  RequestReturnUseCase,
  type Order,
  type OrderRepository,
  type OrderStatus,
} from '@domain/orders';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { ReturnFormScreen } from './ReturnFormScreen';

/**
 * A press commits its state update asynchronously in this environment, so choosing a reason is
 * only settled once the radio reports itself checked. Pressing submit before that would submit
 * the previous selection.
 */
async function chooseReason(label: string) {
  fireEvent.press(screen.getByLabelText(label));
  await waitFor(() =>
    expect(
      screen.getByLabelText(label).props['accessibilityState'].checked,
    ).toBe(true),
  );
}

function buildOrder(status: OrderStatus): Order {
  return {
    id: 'order-1',
    orderNumber: 'BH-284193',
    status,
    lines: [],
    subtotal: Money.fromDecimal('40.000'),
    vat: Money.fromDecimal('2.000'),
    shipping: Money.fromDecimal('2.000'),
    paymentFee: Money.zero(),
    discount: Money.zero(),
    total: Money.fromDecimal('44.000'),
    shippingAddressId: 'address-1',
    paymentMethod: 'CREDIT_CARD',
    deliveryOtp: null,
    createdAt: '2026-08-22T10:08:00.000Z',
  };
}

function repository(
  overrides: Partial<Record<keyof OrderRepository, jest.Mock>> = {},
): jest.Mocked<OrderRepository> {
  return {
    place: jest.fn(),
    getById: jest.fn(async () => ok(buildOrder('DELIVERED'))),
    list: jest.fn(async () => ok([])),
    requestReturn: jest.fn(async () =>
      ok({
        id: 'return-1',
        returnNumber: 'RET-3001',
        orderId: 'order-1',
        reason: 'Arrived damaged',
        status: 'PENDING',
        createdAt: '2026-09-04T00:00:00.000Z',
      }),
    ),
    ...overrides,
  } as unknown as jest.Mocked<OrderRepository>;
}

async function mount(orders = repository()) {
  const onSubmitted = jest.fn();
  await renderWithProviders(
    <ReturnFormScreen
      orderId="order-1"
      orderNumber="BH-284193"
      requestReturn={new RequestReturnUseCase(orders)}
      onBack={jest.fn()}
      onSubmitted={onSubmitted}
    />,
  );
  return { orders, onSubmitted };
}

describe('ReturnFormScreen', () => {
  it('blocks a submission with no reason selected and says why (AC9.10)', async () => {
    const { orders, onSubmitted } = await mount();

    fireEvent.press(screen.getByLabelText('إرسال الطلب'));

    await waitFor(() =>
      expect(screen.getByText('اختر سبب الإرجاع')).toBeOnTheScreen(),
    );
    expect(orders.requestReturn).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('offers the prototype’s five reasons as radios', async () => {
    await mount();

    for (const label of [
      'المنتج مختلف عن الوصف',
      'وصل تالفاً',
      'المقاس غير مناسب',
      'تغيّر رأيي',
      'سبب آخر',
    ]) {
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    }
  });

  it('submits the chosen reason with the note and returns to orders (AC9.11)', async () => {
    const { orders, onSubmitted } = await mount();

    await chooseReason('وصل تالفاً');
    fireEvent.changeText(
      screen.getByLabelText('تفاصيل إضافية'),
      'الشاشة مكسورة',
    );
    await waitFor(() =>
      expect(screen.getByLabelText('تفاصيل إضافية').props['value']).toBe(
        'الشاشة مكسورة',
      ),
    );
    fireEvent.press(screen.getByLabelText('إرسال الطلب'));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(orders.requestReturn).toHaveBeenCalledWith(
      'order-1',
      'DAMAGED',
      'الشاشة مكسورة',
    );
    expect(screen.getByText('تم إرسال طلب الإرجاع')).toBeOnTheScreen();
  });

  it('shows a generic failure when the submission itself fails', async () => {
    const { onSubmitted } = await mount(
      repository({
        requestReturn: jest.fn(async () =>
          err(
            new NetworkError({
              code: 'NETWORK_UNAVAILABLE',
              message: 'offline',
              correlationId: 'test',
            }),
          ),
        ),
      }),
    );

    await chooseReason('وصل تالفاً');
    fireEvent.press(screen.getByLabelText('إرسال الطلب'));

    await waitFor(() =>
      expect(
        screen.getByText('حدث خطأ غير متوقع. حاول مرة أخرى.'),
      ).toBeOnTheScreen(),
    );
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});
