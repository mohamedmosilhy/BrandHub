/** @jest-environment node */

import { NotFoundError } from '@core/errors';

import type { OrderDto } from '@data/orders/dto';

import type {
  HttpClient,
  HttpResponse,
  RequestConfig,
} from '@infrastructure/http';

import { OrderRemoteDataSource } from '../datasources';

import { HttpOrderRepository } from './HttpOrderRepository';

function orderDto(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: 'order-1',
    orderNumber: 'BH-284193',
    userId: 'user-customer',
    status: 'DELIVERED',
    items: [],
    subtotal: 40,
    vat: 2,
    shipping: 2,
    paymentFee: 0,
    discount: 0,
    total: 44,
    currency: 'OMR',
    shippingAddressId: 'address-1',
    paymentMethod: 'CREDIT_CARD',
    walletPayment: false,
    notes: null,
    deliveryOtp: '4826',
    createdAt: '2026-08-22T10:08:00.000Z',
    ...overrides,
  };
}

function page(content: OrderDto[], number = 0) {
  return {
    content,
    number,
    size: 20,
    totalElements: 25,
    totalPages: 2,
  };
}

class FakeHttpClient implements HttpClient {
  readonly requests: RequestConfig[] = [];
  responder: (config: RequestConfig) => unknown = () => undefined;

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    this.requests.push(config);
    return {
      data: this.responder(config) as T,
      status: 200,
      headers: {},
      correlationId: 'cor-orders',
    };
  }
}

function fixture() {
  const http = new FakeHttpClient();
  const repository = new HttpOrderRepository(new OrderRemoteDataSource(http));
  return { http, repository };
}

describe('HttpOrderRepository.list', () => {
  it('pages through /orders, asking for the page and size it was given', async () => {
    const { http, repository } = fixture();
    http.responder = (config) =>
      page(
        [orderDto({ id: `order-${String(config.query?.['page'] ?? 0)}` })],
        Number(config.query?.['page'] ?? 0),
      );

    const first = await repository.list(0, 20);
    const second = await repository.list(1, 20);

    expect(first.ok && first.value[0]?.id).toBe('order-0');
    expect(second.ok && second.value[0]?.id).toBe('order-1');
    expect(http.requests.map((request) => request.query)).toEqual([
      { page: 0, size: 20 },
      { page: 1, size: 20 },
    ]);
  });

  it('maps the page content onto domain orders and leaves the paging block behind', async () => {
    const { http, repository } = fixture();
    http.responder = () => page([orderDto()]);

    const result = await repository.list();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]).toMatchObject({
      orderNumber: 'BH-284193',
      status: 'DELIVERED',
      deliveryOtp: '4826',
    });
    expect(result.value[0]?.total.toDecimal()).toBe(44);
  });

  it('reports a contract mismatch as a failed result rather than throwing', async () => {
    const { http, repository } = fixture();
    http.responder = () => ({ content: [{ id: 'order-1' }] });

    const result = await repository.list();

    expect(result.ok).toBe(false);
  });
});

describe('HttpOrderRepository.getById', () => {
  it('returns the not-found error the API raised, for the screen to render (AC9.6)', async () => {
    const { http, repository } = fixture();
    const notFound = new NotFoundError({
      code: 'ORDER_NOT_FOUND',
      message: 'Order was not found',
      correlationId: 'cor-orders',
    });
    http.responder = () => {
      throw notFound;
    };

    const result = await repository.getById('order-404');

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toBe(notFound);
  });
});

describe('HttpOrderRepository.requestReturn', () => {
  it('posts the fixed reason as free text with the note appended (D19, AC9.11)', async () => {
    const { http, repository } = fixture();
    http.responder = () => ({
      id: 'return-1',
      returnNumber: 'RET-3001',
      userId: 'user-customer',
      orderId: 'order-1',
      reason: 'Arrived damaged: the screen was cracked',
      status: 'PENDING',
      createdAt: '2026-09-04T00:00:00.000Z',
    });

    const result = await repository.requestReturn(
      'order-1',
      'DAMAGED',
      '  the screen was cracked  ',
    );

    expect(result.ok).toBe(true);
    expect(http.requests[0]).toMatchObject({
      method: 'POST',
      endpoint: '/returns',
      body: {
        orderId: 'order-1',
        reason: 'Arrived damaged: the screen was cracked',
      },
    });
  });

  it('sends the reason alone when no note was written', async () => {
    const { http, repository } = fixture();
    http.responder = () => ({
      id: 'return-2',
      returnNumber: 'RET-3002',
      userId: 'user-customer',
      orderId: 'order-1',
      reason: 'Wrong size',
      status: 'PENDING',
      createdAt: '2026-09-04T00:00:00.000Z',
    });

    await repository.requestReturn('order-1', 'WRONG_SIZE', '   ');

    expect(http.requests[0]?.body).toEqual({
      orderId: 'order-1',
      reason: 'Wrong size',
    });
  });
});
