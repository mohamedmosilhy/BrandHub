import type { TicketInput } from '@domain/support';

import { parseResponse } from '@data/shared';
import {
  ticketDtoSchema,
  ticketMessageDtoSchema,
  ticketPageDtoSchema,
  type TicketDto,
  type TicketMessageDto,
} from '@data/support/dto';

import type { HttpClient } from '@infrastructure/http';

export class SupportRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(page: number, size: number): Promise<readonly TicketDto[]> {
    const endpoint = '/support/tickets';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page, size },
    });
    return parseResponse(
      ticketPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).content;
  }

  async getById(id: string): Promise<TicketDto> {
    const endpoint = `/support/tickets/${encodeURIComponent(id)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      ticketDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  /** The contracted body: `{ orderId, category, priority, subject, description }`. */
  async create(input: TicketInput): Promise<TicketDto> {
    const endpoint = '/support/tickets';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: {
        ...(input.orderId ? { orderId: input.orderId } : {}),
        category: input.category,
        priority: input.priority,
        subject: input.subject,
        description: input.description,
      },
    });
    return parseResponse(
      ticketDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  /** The contracted body is `{ message }` — one field, named `message`, not `body` or `text`. */
  async reply(ticketId: string, message: string): Promise<TicketMessageDto> {
    const endpoint = `/support/tickets/${encodeURIComponent(ticketId)}/messages`;
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: { message },
    });
    return parseResponse(
      ticketMessageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
