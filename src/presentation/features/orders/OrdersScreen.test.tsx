import { NetworkError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';

import {
  GetOrdersUseCase,
  type Order,
  type OrderRepository,
  type OrderStatus,
} from '@domain/orders';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { OrdersScreen } from './OrdersScreen';

function buildOrder(index: number, status: OrderStatus): Order {
  return {
    id: `order-${index}`,
    orderNumber: `BH-28${String(index).padStart(4, '0')}`,
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
  list: jest.Mocked<OrderRepository>['list'],
): jest.Mocked<OrderRepository> {
  return {
    place: jest.fn(),
    getById: jest.fn(),
    list,
    requestReturn: jest.fn(),
  } as unknown as jest.Mocked<OrderRepository>;
}

async function mount(list: jest.Mocked<OrderRepository>['list']) {
  const onOrder = jest.fn();
  const port = repository(list);
  await renderWithProviders(
    <OrdersScreen
      getOrders={new GetOrdersUseCase(port)}
      onBack={jest.fn()}
      onOrder={onOrder}
    />,
  );
  return { port, onOrder };
}

describe('OrdersScreen', () => {
  it('lists every order with its status pill and total (AC9.4)', async () => {
    await mount(
      jest.fn(async () =>
        ok([buildOrder(1, 'DELIVERED'), buildOrder(2, 'SHIPPED')]),
      ),
    );

    await waitFor(() =>
      expect(screen.getByText('BH-280001')).toBeOnTheScreen(),
    );
    expect(screen.getByText('BH-280002')).toBeOnTheScreen();
    expect(screen.getByLabelText('تم التسليم')).toBeOnTheScreen();
    expect(screen.getByLabelText('تم الشحن')).toBeOnTheScreen();
    expect(screen.getAllByText('44.000 ر.ع.')).toHaveLength(2);
  });

  it('opens the order that was pressed (AC9.3)', async () => {
    const { onOrder } = await mount(
      jest.fn(async () => ok([buildOrder(1, 'PENDING')])),
    );

    await waitFor(() =>
      expect(screen.getByText('BH-280001')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('رقم الطلب BH-280001'));

    expect(onOrder).toHaveBeenCalledWith('order-1');
  });

  it('shows the empty state for an account with no orders (AC9.5)', async () => {
    await mount(jest.fn(async () => ok([])));

    await waitFor(() =>
      expect(screen.getByText('لا توجد طلبات حتى الآن')).toBeOnTheScreen(),
    );
  });

  it('pages: a full page offers more, and the next page appends (AC9.4)', async () => {
    const first = Array.from({ length: 20 }, (_, index) =>
      buildOrder(index + 1, 'DELIVERED'),
    );
    const list = jest
      .fn()
      .mockResolvedValueOnce(ok(first))
      .mockResolvedValueOnce(ok([buildOrder(21, 'PENDING')]));
    const { port } = await mount(list as never);

    await waitFor(() =>
      expect(screen.getByText('BH-280001')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('عرض الكل'));

    await waitFor(() =>
      expect(screen.getByText('BH-280021')).toBeOnTheScreen(),
    );
    expect(port.list).toHaveBeenNthCalledWith(1, 0, 20);
    expect(port.list).toHaveBeenNthCalledWith(2, 1, 20);
    // The short second page ends the list, so the action goes away.
    expect(screen.queryByLabelText('عرض الكل')).toBeNull();
  });

  it('offers a retry when the list fails to load', async () => {
    const list = jest
      .fn()
      .mockResolvedValueOnce(
        err(
          new NetworkError({
            code: 'NETWORK_UNAVAILABLE',
            message: 'offline',
            correlationId: 'test',
          }),
        ),
      )
      .mockResolvedValueOnce(ok([buildOrder(1, 'PENDING')]));
    await mount(list as never);

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('إعادة المحاولة'));

    await waitFor(() =>
      expect(screen.getByText('BH-280001')).toBeOnTheScreen(),
    );
  });
});
