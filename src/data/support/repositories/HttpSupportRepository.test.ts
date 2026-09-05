/** @jest-environment node */

import { NotFoundError } from '@core/errors';

import type { TicketDto } from '@data/support/dto';

import type {
  HttpClient,
  HttpResponse,
  RequestConfig,
} from '@infrastructure/http';

import { SupportRemoteDataSource } from '../datasources';

import { HttpSupportRepository } from './HttpSupportRepository';

function ticketDto(overrides: Partial<TicketDto> = {}): TicketDto {
  return {
    id: 'ticket-1',
    ticketNumber: 'TKT-2026-0001',
    userId: 'user-customer',
    orderId: 'order-1',
    category: 'DELIVERY',
    priority: 'HIGH',
    subject: 'Order arrived later than promised',
    description: 'The courier has not called yet.',
    status: 'OPEN',
    messages: [
      {
        id: 'ticket-message-1',
        senderType: 'CUSTOMER',
        message: 'The courier has not called yet.',
        createdAt: '2026-09-02T10:14:00.000Z',
      },
      {
        id: 'ticket-message-2',
        senderType: 'ADMIN',
        message: 'It arrives before 6pm.',
        createdAt: '2026-09-02T11:02:00.000Z',
      },
    ],
    createdAt: '2026-09-02T10:14:00.000Z',
    updatedAt: '2026-09-02T11:02:00.000Z',
    ...overrides,
  };
}

const page = (content: TicketDto[]) => ({
  content,
  number: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
});

class FakeHttpClient implements HttpClient {
  readonly requests: RequestConfig[] = [];
  responder: (config: RequestConfig) => unknown = () => undefined;

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    this.requests.push(config);
    return {
      data: this.responder(config) as T,
      status: 200,
      headers: {},
      correlationId: 'cor-support',
    };
  }
}

function fixture() {
  const http = new FakeHttpClient();
  const repository = new HttpSupportRepository(
    new SupportRemoteDataSource(http),
  );
  return { http, repository };
}

describe('HttpSupportRepository.list', () => {
  it('maps the page onto tickets and their two-sided threads', async () => {
    const { http, repository } = fixture();
    http.responder = () => page([ticketDto()]);

    const result = await repository.list();

    expect(http.requests[0]).toMatchObject({
      method: 'GET',
      endpoint: '/support/tickets',
      query: { page: 0, size: 20 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      ticketNumber: 'TKT-2026-0001',
      category: 'DELIVERY',
      priority: 'HIGH',
      status: 'OPEN',
    });
    // Anyone who is not the customer is support, whatever the admin side calls itself.
    expect(result.value[0]?.messages.map((message) => message.author)).toEqual([
      'CUSTOMER',
      'SUPPORT',
    ]);
  });

  it('narrows a value it has never met instead of dropping the ticket', async () => {
    const { http, repository } = fixture();
    http.responder = () =>
      page([
        ticketDto({
          category: 'BILLING_DISPUTE',
          priority: 'URGENT',
          status: 'ESCALATED',
        }),
      ]);

    const result = await repository.list();

    expect(result.ok && result.value).toHaveLength(1);
    expect(result.ok && result.value[0]).toMatchObject({
      category: 'OTHER',
      priority: 'NORMAL',
      status: 'UNKNOWN',
    });
  });

  it('reports a contract mismatch as a failed result rather than throwing', async () => {
    const { http, repository } = fixture();
    http.responder = () => page([{ id: 'ticket-1' } as unknown as TicketDto]);

    expect((await repository.list()).ok).toBe(false);
  });
});

describe('HttpSupportRepository.create', () => {
  it('posts the contracted body and omits orderId when there is none', async () => {
    const { http, repository } = fixture();
    http.responder = () => ticketDto();

    await repository.create({
      category: 'DELIVERY',
      priority: 'HIGH',
      orderId: null,
      subject: 'Late delivery',
      description: 'No call yet.',
    });

    expect(http.requests[0]).toMatchObject({
      method: 'POST',
      endpoint: '/support/tickets',
    });
    expect(http.requests[0]?.body).toEqual({
      category: 'DELIVERY',
      priority: 'HIGH',
      subject: 'Late delivery',
      description: 'No call yet.',
    });
  });

  it('carries the related order when one was chosen', async () => {
    const { http, repository } = fixture();
    http.responder = () => ticketDto();

    await repository.create({
      category: 'ORDER',
      priority: 'NORMAL',
      orderId: 'order-7',
      subject: 'Payment issue',
      description: 'Still pending.',
    });

    expect(http.requests[0]?.body).toMatchObject({ orderId: 'order-7' });
  });
});

describe('HttpSupportRepository.reply', () => {
  it('posts `{ message }` to the ticket’s messages route', async () => {
    const { http, repository } = fixture();
    http.responder = () => ({
      id: 'ticket-message-3',
      senderType: 'CUSTOMER',
      message: 'Thank you, I will wait.',
      createdAt: '2026-09-02T11:20:00.000Z',
    });

    const result = await repository.reply(
      'ticket-1',
      'Thank you, I will wait.',
    );

    expect(http.requests[0]).toMatchObject({
      method: 'POST',
      endpoint: '/support/tickets/ticket-1/messages',
      body: { message: 'Thank you, I will wait.' },
    });
    expect(result.ok && result.value).toMatchObject({
      author: 'CUSTOMER',
      body: 'Thank you, I will wait.',
    });
  });
});

describe('HttpSupportRepository.getById', () => {
  it('returns the not-found error the API raised, for the screen to render', async () => {
    const { http, repository } = fixture();
    const notFound = new NotFoundError({
      code: 'TICKET_NOT_FOUND',
      message: 'Ticket was not found',
      correlationId: 'cor-support',
    });
    http.responder = () => {
      throw notFound;
    };

    const result = await repository.getById('ticket-404');

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toBe(notFound);
  });
});
