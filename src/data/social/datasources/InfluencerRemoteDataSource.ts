import { parseResponse } from '@data/shared';
import {
  influencerDtoSchema,
  influencerPageDtoSchema,
  shoppablePostPageDtoSchema,
  type InfluencerDto,
  type ShoppablePostDto,
} from '@data/social/dto';

import type { HttpClient } from '@infrastructure/http';

/**
 * Every route here is invented (GAP-1 / FA1) and documented in `INVENTED_ENDPOINTS.md`. They are
 * kept in one data source so the backend team's eventual contract lands in a single file.
 */
export class InfluencerRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(page: number, size: number): Promise<readonly InfluencerDto[]> {
    const endpoint = '/influencers';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page, size },
    });
    return parseResponse(
      influencerPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).content;
  }

  async getById(id: string): Promise<InfluencerDto> {
    const endpoint = `/influencers/${encodeURIComponent(id)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      influencerDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async listPosts(
    influencerId: string,
    page: number,
    size: number,
  ): Promise<readonly ShoppablePostDto[]> {
    const endpoint = '/posts';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { influencerId, page, size },
    });
    return parseResponse(
      shoppablePostPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).content;
  }

  async follow(influencerId: string): Promise<void> {
    await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint: `/influencers/${encodeURIComponent(influencerId)}/follow`,
    });
  }

  async unfollow(influencerId: string): Promise<void> {
    await this.httpClient.request<unknown>({
      method: 'DELETE',
      endpoint: `/influencers/${encodeURIComponent(influencerId)}/follow`,
    });
  }
}
