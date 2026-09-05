import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  CreateTicketUseCase,
  GetTicketsUseCase,
  ReplyToTicketUseCase,
  ticketDraftErrors,
  ticketThread,
  type SupportRepository,
  type Ticket,
  type TicketDraft,
} from '@domain/support';

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    ticketNumber: 'TKT-2026-0001',
    orderId: 'order-1',
    category: 'DELIVERY',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Order arrived later than promised',
    description: 'The courier has not called yet.',
    messages: [],
    createdAt: '2026-09-02T10:14:00.000Z',
    updatedAt: '2026-09-02T11:20:00.000Z',
    ...overrides,
  };
}

const draft: TicketDraft = {
  category: 'DELIVERY',
  priority: 'HIGH',
  orderId: 'order-1',
  subject: 'Order arrived later than promised',
  description: 'The courier has not called yet.',
};

function repository(
  overrides: Partial<SupportRepository> = {},
): jest.Mocked<SupportRepository> {
  return {
    list: jest.fn(async () => ok([buildTicket()])),
    getById: jest.fn(async () => ok(buildTicket())),
    create: jest.fn(async () => ok(buildTicket())),
    reply: jest.fn(async () =>
      ok({
        id: 'ticket-message-2',
        author: 'CUSTOMER' as const,
        body: 'Thank you, I will wait.',
        createdAt: '2026-09-02T11:20:00.000Z',
      }),
    ),
    ...overrides,
  } as unknown as jest.Mocked<SupportRepository>;
}

describe('ticket validation', () => {
  it('names every empty required field at once, not one at a time', () => {
    expect(
      ticketDraftErrors({ ...draft, subject: '', description: '' }),
    ).toEqual(['subject', 'description']);
    expect(ticketDraftErrors({ ...draft, subject: '   ' })).toEqual([
      'subject',
    ]);
    expect(ticketDraftErrors(draft)).toEqual([]);
  });

  it('AC12.3 — blocks the create and reports the failing fields', async () => {
    const support = repository();
    const result = await new CreateTicketUseCase(support).execute({
      ...draft,
      subject: '  ',
      description: '',
    });

    expect(result.ok).toBe(false);
    expect(result.ok || result.error.code).toBe('TICKET_INCOMPLETE');
    expect(result.ok || result.error.details).toEqual({
      fields: ['subject', 'description'],
    });
    expect(support.create).not.toHaveBeenCalled();
  });

  it('trims what it sends, so a padded subject is not stored padded', async () => {
    const support = repository();
    await new CreateTicketUseCase(support).execute({
      ...draft,
      subject: '  Late delivery  ',
      description: '  No call yet.  ',
    });

    expect(support.create).toHaveBeenCalledWith({
      ...draft,
      subject: 'Late delivery',
      description: 'No call yet.',
    });
  });
});

describe('ticketThread', () => {
  it('opens with the description when the server started the ticket empty', () => {
    const thread = ticketThread(buildTicket());

    expect(thread).toHaveLength(1);
    expect(thread[0]).toMatchObject({
      author: 'CUSTOMER',
      body: 'The courier has not called yet.',
      createdAt: '2026-09-02T10:14:00.000Z',
    });
  });

  it('never duplicates the description into a thread that already has messages', () => {
    const messages = [
      {
        id: 'ticket-message-1',
        author: 'CUSTOMER' as const,
        body: 'The courier has not called yet.',
        createdAt: '2026-09-02T10:14:00.000Z',
      },
      {
        id: 'ticket-message-2',
        author: 'SUPPORT' as const,
        body: 'It arrives before 6pm.',
        createdAt: '2026-09-02T11:02:00.000Z',
      },
    ];

    expect(ticketThread(buildTicket({ messages }))).toBe(messages);
  });
});

describe('ReplyToTicketUseCase', () => {
  it('AC12.9 — an empty or whitespace reply never reaches the repository', async () => {
    const support = repository();
    const result = await new ReplyToTicketUseCase(support).execute(
      'ticket-1',
      '   ',
    );

    expect(result.ok).toBe(false);
    expect(result.ok || result.error.code).toBe('REPLY_REQUIRED');
    expect(support.reply).not.toHaveBeenCalled();
  });

  it('sends the trimmed message', async () => {
    const support = repository();
    await new ReplyToTicketUseCase(support).execute(
      'ticket-1',
      '  Thank you, I will wait.  ',
    );

    expect(support.reply).toHaveBeenCalledWith(
      'ticket-1',
      'Thank you, I will wait.',
    );
  });

  it('returns the API failure rather than swallowing it', async () => {
    const failure = new ServerError(500, {
      code: 'SERVER',
      message: 'boom',
      correlationId: 'cor-support',
    });
    const result = await new ReplyToTicketUseCase(
      repository({ reply: jest.fn(async () => err(failure)) }),
    ).execute('ticket-1', 'Any update?');

    expect(result).toEqual(err(failure));
  });
});

describe('GetTicketsUseCase', () => {
  it('pages the list at the default size', async () => {
    const support = repository();
    await new GetTicketsUseCase(support).execute();

    expect(support.list).toHaveBeenCalledWith(0, 20);
  });
});
