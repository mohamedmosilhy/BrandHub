import { NotFoundError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';

import type { Address, AddressRepository, City } from '@domain/addresses';
import {
  GetOrderDetailUseCase,
  type Order,
  type OrderRepository,
  type OrderStatus,
} from '@domain/orders';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { OrderDetailScreen } from './OrderDetailScreen';

const address: Address = {
  id: 'address-1',
  label: 'HOME',
  recipientName: 'Salim Al Rashdi',
  phone: '+96899112233',
  details: 'Building 24, Flat 3',
  city: 'Seeb' as City,
  country: 'OM',
  areaId: 'area-seeb',
  isDefault: true,
};

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    orderNumber: 'BH-284193',
    status: 'SHIPPED',
    lines: [],
    subtotal: Money.fromDecimal('40.000'),
    vat: Money.fromDecimal('2.000'),
    shipping: Money.fromDecimal('2.000'),
    paymentFee: Money.zero(),
    discount: Money.zero(),
    total: Money.fromDecimal('44.000'),
    shippingAddressId: 'address-1',
    paymentMethod: 'CREDIT_CARD',
    deliveryOtp: '4826',
    createdAt: '2026-08-22T10:08:00.000Z',
    ...overrides,
  };
}

async function mount(order: Partial<Order> | NotFoundError) {
  const orders = {
    place: jest.fn(),
    getById: jest.fn(async () =>
      order instanceof NotFoundError ? err(order) : ok(buildOrder(order)),
    ),
    list: jest.fn(),
    requestReturn: jest.fn(),
  } as unknown as jest.Mocked<OrderRepository>;
  const addresses = {
    list: jest.fn(),
    getById: jest.fn(async () => ok(address)),
    create: jest.fn(),
    update: jest.fn(),
    setDefault: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<AddressRepository>;
  const onReturn = jest.fn();
  const onSupport = jest.fn();
  await renderWithProviders(
    <OrderDetailScreen
      orderId="order-1"
      getOrder={new GetOrderDetailUseCase(orders)}
      addressRepository={addresses}
      onBack={jest.fn()}
      onReturn={onReturn}
      onSupport={onSupport}
    />,
  );
  return { onReturn, onSupport };
}

describe('OrderDetailScreen', () => {
  it('shows the timeline, totals and shipping address of the order (AC9.6, AC9.8)', async () => {
    await mount({ status: 'SHIPPED' });

    await waitFor(() =>
      expect(screen.getByText('تم الإنشاء')).toBeOnTheScreen(),
    );
    for (const step of ['قيد التجهيز', 'تم الشحن', 'تم التسليم']) {
      expect(screen.getByText(step)).toBeOnTheScreen();
    }
    expect(screen.getByText('40.000')).toBeOnTheScreen();
    // VAT and delivery are both 2.000 in this fixture, so both rows are present.
    expect(screen.getAllByText('2.000')).toHaveLength(2);
    expect(screen.getByText('44.000 ر.ع.')).toBeOnTheScreen();
    expect(screen.getByText('مدفوع · بطاقة مصرفية')).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByText('Building 24, Flat 3 — Seeb')).toBeOnTheScreen(),
    );
  });

  it.each([
    ['PENDING', true],
    ['SHIPPED', true],
    ['DELIVERED', false],
    ['CANCELLED', false],
  ])(
    'shows the delivery OTP for %s only while the courier still needs it (AC9.7)',
    async (status, visible) => {
      await mount({ status: status as OrderStatus });

      await waitFor(() =>
        expect(screen.getByText('تم الإنشاء')).toBeOnTheScreen(),
      );
      expect(screen.queryByText('4826') !== null).toBe(visible);
      if (visible) {
        expect(
          screen.getByText('أعطِ الرمز للمندوب عند الاستلام'),
        ).toBeOnTheScreen();
      }
    },
  );

  it('hides the OTP panel entirely when the order carries no code (AC9.7)', async () => {
    await mount({ deliveryOtp: null });

    await waitFor(() =>
      expect(screen.getByText('تم الإنشاء')).toBeOnTheScreen(),
    );
    expect(screen.queryByLabelText('رمز التسليم')).toBeNull();
  });

  it('offers the return action only for a delivered order (BR8, AC9.9)', async () => {
    await mount({ status: 'DELIVERED' });

    await waitFor(() =>
      expect(screen.getByLabelText('طلب إرجاع')).toBeOnTheScreen(),
    );
  });

  it('hides the return action for an order still in flight (AC9.9)', async () => {
    const { onSupport } = await mount({ status: 'SHIPPED' });

    await waitFor(() =>
      expect(screen.getByLabelText('تواصل مع الدعم')).toBeOnTheScreen(),
    );
    expect(screen.queryByLabelText('طلب إرجاع')).toBeNull();

    fireEvent.press(screen.getByLabelText('تواصل مع الدعم'));
    expect(onSupport).toHaveBeenCalledTimes(1);
  });

  it('passes the order number to the return form (AC9.11)', async () => {
    const { onReturn } = await mount({ status: 'DELIVERED' });

    await waitFor(() =>
      expect(screen.getByLabelText('طلب إرجاع')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('طلب إرجاع'));

    expect(onReturn).toHaveBeenCalledWith('BH-284193');
  });

  it('shows a not-found state when the order does not exist', async () => {
    await mount(
      new NotFoundError({
        code: 'ORDER_NOT_FOUND',
        message: 'Order was not found',
        correlationId: 'test',
      }),
    );

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
  });
});
