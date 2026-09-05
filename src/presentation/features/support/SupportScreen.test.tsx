import { ServerError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok } from '@core/result';

import {
  GetOrdersUseCase,
  type Order,
  type OrderRepository,
} from '@domain/orders';
import {
  CreateTicketUseCase,
  GetTicketsUseCase,
  type SupportRepository,
  type Ticket,
  type TicketInput,
} from '@domain/support';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { SupportScreen } from './SupportScreen';

/**
 * This project's Jest environment does not configure React's `act`, so a `useState` update made
 * in response to a press lands one tick after `fireEvent` returns. Every assertion that depends on
 * one is therefore made through `waitFor`, and typing waits for the value it just wrote.
 */
async function type(label: string, value: string) {
  fireEvent.changeText(screen.getByLabelText(label), value);
  await waitFor(() =>
    expect(screen.getByLabelText(label).props['value']).toBe(value),
  );
}

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    ticketNumber: 'TKT-2026-0001',
    orderId: 'order-1',
    category: 'DELIVERY',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'لم يصل الطلب في الوقت المحدد',
    description: 'الطلب كان مقرراً أمس.',
    messages: [],
    createdAt: '2026-09-02T10:14:00.000Z',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1_000).toISOString(),
    ...overrides,
  };
}

function buildOrder(index: number): Order {
  return {
    id: `order-${index}`,
    orderNumber: `BH-28000${index}`,
    status: 'DELIVERED',
    lines: [],
    subtotal: Money.fromDecimal('40.000'),
    vat: Money.zero(),
    shipping: Money.zero(),
    paymentFee: Money.zero(),
    discount: Money.zero(),
    total: Money.fromDecimal('40.000'),
    shippingAddressId: 'address-1',
    paymentMethod: 'CREDIT_CARD',
    deliveryOtp: null,
    createdAt: '2026-08-22T10:08:00.000Z',
  };
}

/** Stateful, like the server: a created ticket has to appear in the list it is added to. */
function supportRepository(
  overrides: Partial<SupportRepository> = {},
): jest.Mocked<SupportRepository> {
  let tickets: Ticket[] = [buildTicket()];
  return {
    list: jest.fn(async () => ok(tickets)),
    getById: jest.fn(async () => ok(tickets[0] as Ticket)),
    create: jest.fn(async (input: TicketInput) => {
      const created = buildTicket({
        ...input,
        id: 'ticket-2',
        ticketNumber: 'TKT-2026-0002',
        status: 'OPEN',
      });
      tickets = [created, ...tickets];
      return ok(created);
    }),
    reply: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<SupportRepository>;
}

function orderRepository(): jest.Mocked<OrderRepository> {
  return {
    place: jest.fn(),
    getById: jest.fn(),
    list: jest.fn(async () => ok([buildOrder(1), buildOrder(2)])),
    requestReturn: jest.fn(),
  } as unknown as jest.Mocked<OrderRepository>;
}

async function mount({
  support = supportRepository(),
  orderId,
}: { support?: jest.Mocked<SupportRepository>; orderId?: string } = {}) {
  const orders = orderRepository();
  const onOpenTicket = jest.fn();
  await renderWithProviders(
    <SupportScreen
      {...(orderId ? { orderId } : {})}
      getTickets={new GetTicketsUseCase(support)}
      getOrders={new GetOrdersUseCase(orders)}
      createTicket={new CreateTicketUseCase(support)}
      onBack={jest.fn()}
      onOpenTicket={onOpenTicket}
    />,
  );
  return { support, orders, onOpenTicket };
}

describe('SupportScreen — the new-ticket form', () => {
  it('AC12.1 — offers six categories and three priorities, one selected each', async () => {
    await mount();

    for (const label of ['طلب', 'دفع', 'توصيل', 'إرجاع', 'محفظة', 'أخرى'])
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    for (const label of ['منخفضة', 'متوسطة', 'عالية'])
      expect(screen.getByLabelText(label)).toBeOnTheScreen();

    const selected = (label: string) =>
      screen.getByLabelText(label).props['accessibilityState'].selected;
    // The defaults: the contract's ORDER category and its NORMAL priority.
    expect(selected('طلب')).toBe(true);
    expect(selected('متوسطة')).toBe(true);

    fireEvent.press(screen.getByLabelText('محفظة'));
    await waitFor(() => expect(selected('محفظة')).toBe(true));
    expect(selected('طلب')).toBe(false);
  });

  it('AC12.2 — the related-order select lists the account’s orders', async () => {
    await mount();

    fireEvent.press(screen.getByLabelText('الطلب المرتبط'));
    await waitFor(() =>
      expect(screen.getByText('BH-280001')).toBeOnTheScreen(),
    );
    expect(screen.getByText('BH-280002')).toBeOnTheScreen();
  });

  it('AC12.3 — blocks a submit with no subject and no description, naming both', async () => {
    const { support } = await mount();

    fireEvent.press(screen.getByLabelText('إرسال التذكرة'));

    await waitFor(() =>
      expect(screen.getByText('اكتب موضوع التذكرة')).toBeOnTheScreen(),
    );
    expect(screen.getByText('اكتب وصف المشكلة')).toBeOnTheScreen();
    expect(support.create).not.toHaveBeenCalled();
  });

  it('AC12.4 — a valid submit creates the ticket and puts it at the top of the list', async () => {
    const { support } = await mount();

    await type('الموضوع', 'رمز الخصم لا يعمل');
    await type('الوصف', 'الرمز يعطي خطأ.');
    fireEvent.press(screen.getByLabelText('إرسال التذكرة'));

    await waitFor(() => expect(support.create).toHaveBeenCalled());
    expect(support.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'ORDER',
        priority: 'NORMAL',
        subject: 'رمز الخصم لا يعمل',
        description: 'الرمز يعطي خطأ.',
      }),
    );
    await waitFor(() =>
      expect(screen.getByText('TKT-2026-0002')).toBeOnTheScreen(),
    );
    // The new ticket is first; the seeded one is still there behind it.
    const numbers = screen
      .getAllByText(/TKT-2026-\d{4}/)
      .map((node) => node.props['children']);
    expect(numbers[0]).toBe('TKT-2026-0002');
    // The form is cleared, so a second tap cannot resubmit the same words.
    await waitFor(() =>
      expect(screen.getByLabelText('الموضوع').props['value']).toBe(''),
    );
  });

  it('AC12.10 — an order carried in from order detail is preselected', async () => {
    const { support } = await mount({ orderId: 'order-2' });

    await type('الموضوع', 'مشكلة في الطلب');
    await type('الوصف', 'لم يصل.');
    fireEvent.press(screen.getByLabelText('إرسال التذكرة'));

    await waitFor(() =>
      expect(support.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order-2' }),
      ),
    );
  });

  it('reports a failed create without clearing what was typed', async () => {
    const { support } = await mount({
      support: supportRepository({
        create: jest.fn(async () =>
          err(
            new ServerError(500, {
              code: 'SERVER',
              message: 'boom',
              correlationId: 'cor-support',
            }),
          ),
        ),
      }),
    });

    await type('الموضوع', 'موضوع');
    await type('الوصف', 'وصف');
    fireEvent.press(screen.getByLabelText('إرسال التذكرة'));

    await waitFor(() =>
      expect(
        screen.getByText('تعذّر إنشاء التذكرة. حاول مرة أخرى.'),
      ).toBeOnTheScreen(),
    );
    expect(support.create).toHaveBeenCalled();
    expect(screen.getByLabelText('الموضوع').props['value']).toBe('موضوع');
  });
});

describe('SupportScreen — my tickets', () => {
  it('AC12.5 — shows number, status pill, subject and the meta line', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByText('TKT-2026-0001')).toBeOnTheScreen(),
    );
    expect(screen.getByText('لم يصل الطلب في الوقت المحدد')).toBeOnTheScreen();
    expect(screen.getByLabelText('مفتوحة')).toBeOnTheScreen();
    expect(screen.getByText('توصيل · عالية · قبل 2 ساعة')).toBeOnTheScreen();
  });

  it('AC12.6 — tapping a ticket opens its thread', async () => {
    const { onOpenTicket } = await mount();

    await waitFor(() =>
      expect(
        screen.getByLabelText('لم يصل الطلب في الوقت المحدد'),
      ).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('لم يصل الطلب في الوقت المحدد'));

    expect(onOpenTicket).toHaveBeenCalledWith('ticket-1');
  });

  it('AC12.11 — an account with no tickets shows the empty state', async () => {
    await mount({
      support: supportRepository({ list: jest.fn(async () => ok([])) }),
    });

    await waitFor(() =>
      expect(screen.getByText('لا توجد تذاكر دعم')).toBeOnTheScreen(),
    );
  });

  it('offers a retry when the list cannot be read', async () => {
    const { support } = await mount({
      support: supportRepository({
        list: jest.fn(async () =>
          err(
            new ServerError(503, {
              code: 'SERVER',
              message: 'down',
              correlationId: 'cor-support',
            }),
          ),
        ),
      }),
    });

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await waitFor(() => expect(support.list).toHaveBeenCalledTimes(2));
  });
});
