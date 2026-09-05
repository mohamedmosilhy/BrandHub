import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  GetTicketUseCase,
  ReplyToTicketUseCase,
  type SupportRepository,
  type Ticket,
  type TicketMessage,
} from '@domain/support';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { TicketScreen } from './TicketScreen';

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1_000).toISOString();

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    ticketNumber: 'TKT-2026-0001',
    orderId: 'BH-283740',
    category: 'DELIVERY',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'لم يصل الطلب في الوقت المحدد',
    description: 'الطلب كان مقرراً أمس.',
    messages: [
      {
        id: 'ticket-1-message-1',
        author: 'CUSTOMER',
        body: 'الطلب كان مقرراً أمس.',
        createdAt: hoursAgo(3),
      },
      {
        id: 'ticket-1-message-2',
        author: 'SUPPORT',
        body: 'الشحنة مع المندوب وستصل اليوم.',
        createdAt: hoursAgo(2),
      },
    ],
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(2),
    ...overrides,
  };
}

/** Stateful: a sent reply has to survive the refetch that follows it. */
function repository(
  overrides: Partial<SupportRepository> = {},
): jest.Mocked<SupportRepository> {
  let ticket = buildTicket();
  return {
    list: jest.fn(async () => ok([ticket])),
    getById: jest.fn(async () => ok(ticket)),
    create: jest.fn(),
    reply: jest.fn(async (_id: string, message: string) => {
      const appended: TicketMessage = {
        id: `ticket-1-message-${ticket.messages.length + 1}`,
        author: 'CUSTOMER',
        body: message,
        createdAt: hoursAgo(0),
      };
      ticket = {
        ...ticket,
        messages: [...ticket.messages, appended],
        updatedAt: appended.createdAt,
      };
      return ok(appended);
    }),
    ...overrides,
  } as unknown as jest.Mocked<SupportRepository>;
}

async function mount(support = repository()) {
  await renderWithProviders(
    <TicketScreen
      ticketId="ticket-1"
      getTicket={new GetTicketUseCase(support)}
      replyToTicket={new ReplyToTicketUseCase(support)}
      onBack={jest.fn()}
    />,
  );
  return { support };
}

describe('TicketScreen', () => {
  it('AC12.6 — shows the number, status and the meta chips', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByText('TKT-2026-0001')).toBeOnTheScreen(),
    );
    expect(screen.getByText('لم يصل الطلب في الوقت المحدد')).toBeOnTheScreen();
    expect(screen.getByLabelText('مفتوحة')).toBeOnTheScreen();
    expect(screen.getByLabelText('توصيل')).toBeOnTheScreen();
    expect(screen.getByLabelText('عالية')).toBeOnTheScreen();
    expect(screen.getByLabelText('BH-283740')).toBeOnTheScreen();
    expect(screen.getByText('آخر تحديث: قبل 2 ساعة')).toBeOnTheScreen();
  });

  it('AC12.7 — renders both sides with their author, time and alignment', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByText('الطلب كان مقرراً أمس.')).toBeOnTheScreen(),
    );
    expect(screen.getByText('أنت · قبل 3 ساعة')).toBeOnTheScreen();
    expect(screen.getByText('فريق الدعم · قبل 2 ساعة')).toBeOnTheScreen();

    // The customer's own bubble starts at the reading edge; support's ends at it. `flex-start`
    // and `flex-end` are resolved against the direction, so this holds in both languages.
    const alignOf = (body: string) => {
      const style = screen.getByLabelText(body).props['style'] as
        { alignSelf?: string } | { alignSelf?: string }[];
      return (Array.isArray(style) ? style : [style])
        .map((entry) => entry?.alignSelf)
        .find(Boolean);
    };
    expect(alignOf('الطلب كان مقرراً أمس.')).toBe('flex-start');
    expect(alignOf('الشحنة مع المندوب وستصل اليوم.')).toBe('flex-end');
  });

  it('AC12.8 — a reply appends to the thread and clears the box', async () => {
    const { support } = await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('اكتب ردك…')).toBeOnTheScreen(),
    );
    fireEvent.changeText(screen.getByLabelText('اكتب ردك…'), 'شكراً لكم.');
    await waitFor(() =>
      expect(screen.getByLabelText('اكتب ردك…').props['value']).toBe(
        'شكراً لكم.',
      ),
    );
    fireEvent.press(screen.getByLabelText('إرسال'));

    await waitFor(() =>
      expect(support.reply).toHaveBeenCalledWith('ticket-1', 'شكراً لكم.'),
    );
    await waitFor(() =>
      expect(screen.getByText('شكراً لكم.')).toBeOnTheScreen(),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('اكتب ردك…').props['value']).toBe(''),
    );
  });

  it('AC12.9 — an empty reply is blocked and never reaches the repository', async () => {
    const { support } = await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('إرسال')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('إرسال'));

    await waitFor(() =>
      expect(screen.getByText('اكتب ردك أولاً')).toBeOnTheScreen(),
    );
    expect(support.reply).not.toHaveBeenCalled();
  });

  it('reports a failed reply without losing what was typed', async () => {
    await mount(
      repository({
        reply: jest.fn(async () =>
          err(
            new ServerError(500, {
              code: 'SERVER',
              message: 'boom',
              correlationId: 'cor-support',
            }),
          ),
        ),
      }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText('اكتب ردك…')).toBeOnTheScreen(),
    );
    fireEvent.changeText(screen.getByLabelText('اكتب ردك…'), 'أي جديد؟');
    await waitFor(() =>
      expect(screen.getByLabelText('اكتب ردك…').props['value']).toBe(
        'أي جديد؟',
      ),
    );
    fireEvent.press(screen.getByLabelText('إرسال'));

    await waitFor(() =>
      expect(
        screen.getByText('تعذّر إرسال الرد. حاول مرة أخرى.'),
      ).toBeOnTheScreen(),
    );
    expect(screen.getByLabelText('اكتب ردك…').props['value']).toBe('أي جديد؟');
  });

  it('opens the thread with the description when the server kept no messages', async () => {
    await mount(
      repository({
        getById: jest.fn(async () => ok(buildTicket({ messages: [] }))),
      }),
    );

    await waitFor(() =>
      expect(screen.getByText('الطلب كان مقرراً أمس.')).toBeOnTheScreen(),
    );
    expect(screen.getByText('أنت · قبل 3 ساعة')).toBeOnTheScreen();
  });

  it('offers a retry when the ticket cannot be read', async () => {
    const support = repository({
      getById: jest.fn(async () =>
        err(
          new ServerError(503, {
            code: 'SERVER',
            message: 'down',
            correlationId: 'cor-support',
          }),
        ),
      ),
    });
    await mount(support);

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await waitFor(() => expect(support.getById).toHaveBeenCalledTimes(2));
  });
});
