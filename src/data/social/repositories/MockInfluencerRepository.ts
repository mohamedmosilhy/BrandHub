import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import { DEFAULT_PAGE_SIZE, type InfluencerRepository } from '@domain/social';

import type { AssetUrlResolver } from '@data/catalog/mappers';
import type { InfluencerRemoteDataSource } from '@data/social/datasources';
import { mapInfluencer, mapShoppablePost } from '@data/social/mappers';

import { normalizeHttpError } from '@infrastructure/http';

/**
 * Provisional by name (AD-20 / FA1). Influencers, shoppable posts and follows are the one feature
 * area with **no backend contract**: this implementation speaks to the mock host's invented
 * routes, and it is the only thing in the app that stops working at migration. Nothing above it
 * knows that — the screens depend on `InfluencerRepository` — so replacing it with an
 * `HttpInfluencerRepository` once FA1 lands is a one-line change in the container.
 */
export class MockInfluencerRepository implements InfluencerRepository {
  constructor(
    private readonly remote: InfluencerRemoteDataSource,
    private readonly resolveUrl?: AssetUrlResolver,
  ) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async list(page = 0, size = DEFAULT_PAGE_SIZE) {
    try {
      const influencers = await this.remote.list(page, size);
      return ok(
        influencers.map((influencer) =>
          mapInfluencer(influencer, this.resolveUrl),
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async getById(id: string) {
    try {
      return ok(mapInfluencer(await this.remote.getById(id), this.resolveUrl));
    } catch (error) {
      return this.failure(error);
    }
  }

  async listPosts(influencerId: string, page = 0, size = DEFAULT_PAGE_SIZE) {
    try {
      const posts = await this.remote.listPosts(influencerId, page, size);
      return ok(posts.map((post) => mapShoppablePost(post, this.resolveUrl)));
    } catch (error) {
      return this.failure(error);
    }
  }

  async follow(influencerId: string) {
    try {
      await this.remote.follow(influencerId);
      return ok(undefined);
    } catch (error) {
      return this.failure(error);
    }
  }

  async unfollow(influencerId: string) {
    try {
      await this.remote.unfollow(influencerId);
      return ok(undefined);
    } catch (error) {
      return this.failure(error);
    }
  }
}
