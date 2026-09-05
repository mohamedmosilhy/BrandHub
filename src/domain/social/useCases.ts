import type { AppError } from '@core/errors';
import { ok, type Result } from '@core/result';

import type { Influencer, InfluencerProfile } from './entities';
import type { InfluencerRepository } from './InfluencerRepository';

/** The influencers list and a profile's feed are both paged at the catalogue's page size. */
export const DEFAULT_PAGE_SIZE = 20;

export class GetInfluencersUseCase {
  constructor(private readonly repository: InfluencerRepository) {}
  execute(
    page = 0,
    size = DEFAULT_PAGE_SIZE,
  ): Promise<Result<readonly Influencer[], AppError>> {
    return this.repository.list(page, size);
  }
}

/**
 * The profile screen is one thing on screen, so it is one thing to load: an influencer and the
 * feed underneath them. Fetching them together keeps the screen from rendering a header whose
 * follower count and post list disagree about which influencer is open.
 */
export class GetInfluencerProfileUseCase {
  constructor(private readonly repository: InfluencerRepository) {}

  async execute(id: string): Promise<Result<InfluencerProfile, AppError>> {
    const influencer = await this.repository.getById(id);
    if (!influencer.ok) return influencer;
    const posts = await this.repository.listPosts(id);
    if (!posts.ok) return posts;
    return ok({ influencer: influencer.value, posts: posts.value });
  }
}

/**
 * Following toggles on the relationship the caller is currently showing, the way the wishlist
 * heart does (BR6): a second tap on a followed influencer unfollows rather than following twice.
 * The new state is returned so the caller writes back a fact rather than assuming one.
 */
export class FollowInfluencerUseCase {
  constructor(private readonly repository: InfluencerRepository) {}

  async execute(
    influencerId: string,
    currentlyFollowing: boolean,
  ): Promise<Result<boolean, AppError>> {
    const result = currentlyFollowing
      ? await this.repository.unfollow(influencerId)
      : await this.repository.follow(influencerId);
    if (!result.ok) return result;
    return ok(!currentlyFollowing);
  }
}
