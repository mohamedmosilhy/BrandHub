import { z } from 'zod';

import type { AccountMetrics } from '@domain/identity';

import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

const walletSchema = z.object({ balance: z.number() });
/** Every paged collection carries `totalElements`, which is the count without fetching the page. */
const countSchema = z.object({ totalElements: z.number().int().nonnegative() });

export class AccountRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async get(): Promise<AccountMetrics> {
    const [walletBalance, ticketCount, returnCount] = await Promise.all([
      this.balance(),
      this.count('/support/tickets'),
      this.count('/returns'),
    ]);
    return { walletBalance, ticketCount, returnCount };
  }

  private async balance(): Promise<number> {
    const endpoint = '/wallet';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      walletSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).balance;
  }

  /** `size: 1` because only the total is wanted; the page itself is thrown away. */
  private async count(endpoint: string): Promise<number> {
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page: 0, size: 1 },
    });
    return parseResponse(
      countSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).totalElements;
  }
}
