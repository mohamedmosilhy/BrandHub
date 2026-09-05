import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  FollowInfluencerUseCase,
  followerCount,
  GetInfluencerProfileUseCase,
  GetInfluencersUseCase,
  handle,
  type Influencer,
  type InfluencerRepository,
  type ShoppablePost,
} from '@domain/social';

function influencer(overrides: Partial<Influencer> = {}): Influencer {
  return {
    id: 'influencer-1',
    name: 'Layan Al Maamari',
    handle: handle('layan.style'),
    bio: 'Fashion & daily looks',
    avatarUrl: null,
    followers: followerCount(215_000),
    postCount: 128,
    productCount: 46,
    following: false,
    ...overrides,
  };
}

const post: ShoppablePost = {
  id: 'post-1',
  influencerId: 'influencer-1',
  imageUrl: null,
  caption: 'Today’s look',
  likes: 2_400,
  comments: 86,
  products: [],
  createdAt: '2026-09-02T12:00:00.000Z',
};

function repository(
  overrides: Partial<InfluencerRepository> = {},
): InfluencerRepository {
  return {
    list: jest.fn(async () => ok([influencer()])),
    getById: jest.fn(async () => ok(influencer())),
    listPosts: jest.fn(async () => ok([post])),
    follow: jest.fn(async () => ok(undefined)),
    unfollow: jest.fn(async () => ok(undefined)),
    ...overrides,
  } as InfluencerRepository;
}

describe('social value objects', () => {
  it('prints a handle with exactly one leading @', () => {
    expect(handle('layan.style')).toBe('@layan.style');
    expect(handle('@layan.style')).toBe('@layan.style');
    expect(handle('  @@layan.style ')).toBe('@layan.style');
  });

  it('floors a follower count and never lets it go negative', () => {
    expect(followerCount(215_000.7)).toBe(215_000);
    expect(followerCount(-4)).toBe(0);
    expect(followerCount(Number.NaN)).toBe(0);
  });
});

describe('GetInfluencerProfileUseCase', () => {
  it('loads the influencer and their feed as one profile', async () => {
    const result = await new GetInfluencerProfileUseCase(repository()).execute(
      'influencer-1',
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.influencer.id).toBe('influencer-1');
    expect(result.value.posts).toEqual([post]);
  });

  it('fails the whole profile when the feed cannot be read', async () => {
    const failure = new ServerError(500, {
      code: 'SERVER',
      message: 'boom',
      correlationId: 'cor-1',
    });
    const result = await new GetInfluencerProfileUseCase(
      repository({ listPosts: jest.fn(async () => err(failure)) }),
    ).execute('influencer-1');

    expect(result).toEqual(err(failure));
  });
});

describe('FollowInfluencerUseCase', () => {
  it('follows an influencer the caller is not following', async () => {
    const social = repository();
    const result = await new FollowInfluencerUseCase(social).execute(
      'influencer-1',
      false,
    );

    expect(result).toEqual(ok(true));
    expect(social.follow).toHaveBeenCalledWith('influencer-1');
    expect(social.unfollow).not.toHaveBeenCalled();
  });

  it('unfollows on a second tap rather than following twice', async () => {
    const social = repository();
    const result = await new FollowInfluencerUseCase(social).execute(
      'influencer-1',
      true,
    );

    expect(result).toEqual(ok(false));
    expect(social.unfollow).toHaveBeenCalledWith('influencer-1');
    expect(social.follow).not.toHaveBeenCalled();
  });

  it('keeps the current state when the write fails', async () => {
    const failure = new ServerError(500, {
      code: 'SERVER',
      message: 'boom',
      correlationId: 'cor-2',
    });
    const result = await new FollowInfluencerUseCase(
      repository({ follow: jest.fn(async () => err(failure)) }),
    ).execute('influencer-1', false);

    expect(result).toEqual(err(failure));
  });
});

describe('GetInfluencersUseCase', () => {
  it('pages the directory at the default size', async () => {
    const social = repository();
    await new GetInfluencersUseCase(social).execute();

    expect(social.list).toHaveBeenCalledWith(0, 20);
  });
});
