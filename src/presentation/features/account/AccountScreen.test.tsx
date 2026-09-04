import { Money } from '@core/money';
import { ok } from '@core/result';

import type { Address, AddressRepository, City } from '@domain/addresses';
import type { AccountMetricsRepository, Session } from '@domain/identity';
import {
  GetOrdersUseCase,
  type Order,
  type OrderRepository,
  type OrderStatus,
} from '@domain/orders';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { AccountScreen, maskPhone } from './AccountScreen';

const session: Session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: {
    id: 'user-customer',
    email: 'salim.rashdi@example.om',
    firstName: 'Salim',
    lastName: 'Al Rashdi',
    phone: '+96891234542',
    accountType: 'customer',
  },
};

function buildOrder(id: string, status: OrderStatus): Order {
  return {
    id,
    orderNumber: `BH-${id}`,
    status,
    lines: [],
    subtotal: Money.zero(),
    vat: Money.zero(),
    shipping: Money.zero(),
    paymentFee: Money.zero(),
    discount: Money.zero(),
    total: Money.zero(),
    shippingAddressId: 'address-1',
    paymentMethod: 'CREDIT_CARD',
    deliveryOtp: null,
    createdAt: '2026-08-22T10:08:00.000Z',
  };
}

const address = { id: 'address-1', city: 'Seeb' as City } as Address;

async function mount() {
  const orders = {
    place: jest.fn(),
    getById: jest.fn(),
    list: jest.fn(async () =>
      ok([
        buildOrder('1', 'PENDING'),
        buildOrder('2', 'SHIPPED'),
        buildOrder('3', 'DELIVERED'),
        buildOrder('4', 'CANCELLED'),
      ]),
    ),
    requestReturn: jest.fn(),
  } as unknown as jest.Mocked<OrderRepository>;
  const addresses = {
    list: jest.fn(async () =>
      ok([address, address, address, address, address]),
    ),
  } as unknown as jest.Mocked<AddressRepository>;
  const metrics: AccountMetricsRepository = {
    get: jest.fn(async () =>
      ok({ walletBalance: 43.4, ticketCount: 3, returnCount: 1 }),
    ),
  };
  const onNavigate = jest.fn();
  const onSignOut = jest.fn();
  const onChangeLanguage = jest.fn();
  await renderWithProviders(
    <AccountScreen
      session={session}
      getOrders={new GetOrdersUseCase(orders)}
      addressRepository={addresses}
      metricsRepository={metrics}
      onNavigate={onNavigate}
      onChangeLanguage={onChangeLanguage}
      onSignOut={onSignOut}
    />,
  );
  // Every test starts from a fully settled screen, and each `fireEvent.press` below is awaited
  // before the next one. Leaving work in flight at the end of a test lets its cleanup race the
  // following test's mount, which unmounts that tree before it can be queried.
  await waitFor(() => expect(screen.getByText('43.400')).toBeOnTheScreen());
  return { onNavigate, onSignOut, onChangeLanguage };
}

describe('AccountScreen', () => {
  it('shows the signed-in name and masked phone (AC9.1)', async () => {
    await mount();

    expect(screen.getByText('Salim Al Rashdi')).toBeOnTheScreen();
    expect(screen.getByText('+968 9•• ••• 42')).toBeOnTheScreen();
  });

  it('lists the prototype’s nine rows in its order (AC9.2)', async () => {
    await mount();

    for (const label of [
      'طلباتي',
      'المفضلة',
      'العناوين',
      'المحفظة',
      'إهداء رصيد',
      'الدعم الفني',
      'الملف الشخصي',
      'المؤثرون المتابَعون',
      'الإشعارات',
    ]) {
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    }
  });

  it('shows live counts beside the rows that have one (AC9.2)', async () => {
    await mount();

    // Four orders, five addresses, three tickets, and the wallet balance in OMR.
    expect(screen.getByText('5')).toBeOnTheScreen();
    expect(screen.getByText('4')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('43.400')).toBeOnTheScreen();
  });

  it('counts in-progress and delivered orders in the stats row', async () => {
    await mount();

    // Pending and shipped are in progress; delivered is one; cancelled counts as neither.
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('قيد التنفيذ')).toBeOnTheScreen();
    expect(screen.getByText('تم التسليم')).toBeOnTheScreen();
    expect(screen.getByText('قيد المراجعة')).toBeOnTheScreen();
    // One delivered order and one return under review both render a "1".
    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  it('navigates to the destination of the row that was pressed (AC9.3)', async () => {
    const { onNavigate } = await mount();

    fireEvent.press(screen.getByLabelText('العناوين'));
    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByLabelText('تعديل'));
    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(2));

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'Addresses');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'Profile');
  });

  it('switches the language and signs out through its callbacks (AC9.18, AC9.19)', async () => {
    const { onChangeLanguage, onSignOut } = await mount();

    fireEvent.press(screen.getByLabelText('English'));
    await waitFor(() => expect(onChangeLanguage).toHaveBeenCalledWith('en'));
    fireEvent.press(screen.getByLabelText('تسجيل الخروج'));
    await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(1));
  });
});

/**
 * Kept last on purpose. These render nothing, and a non-rendering test ahead of the rendering
 * ones leaves this environment's cleanup in a state where a later `render` never commits.
 */
describe('maskPhone', () => {
  it('keeps the country code and the last two digits only (AC9.1)', () => {
    expect(maskPhone('+96891234542')).toBe('+968 9•• ••• 42');
  });

  it('returns null for a missing or unusable number, so the email shows instead', () => {
    expect(maskPhone(undefined)).toBeNull();
    expect(maskPhone('123')).toBeNull();
  });
});
