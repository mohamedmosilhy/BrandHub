import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Influencer, ShoppablePost } from './entities';

/**
 * Social commerce is the one feature with no backend contract (GAP-1). The port is real and the
 * screens depend on nothing else; only the implementation is provisional, and it is named so
 * (`MockInfluencerRepository`) — see `data/social` and `INVENTED_ENDPOINTS.md` (FA1).
 */
export interface InfluencerRepository {
  list(
    page?: number,
    size?: number,
  ): Promise<Result<readonly Influencer[], AppError>>;
  getById(id: string): Promise<Result<Influencer, AppError>>;
  listPosts(
    influencerId: string,
    page?: number,
    size?: number,
  ): Promise<Result<readonly ShoppablePost[], AppError>>;
  follow(influencerId: string): Promise<Result<void, AppError>>;
  unfollow(influencerId: string): Promise<Result<void, AppError>>;
}
