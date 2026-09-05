import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  FollowInfluencerUseCase,
  followerCount,
  GetInfluencersUseCase,
  handle,
  type Influencer,
  type InfluencerRepository,
} from '@domain/social';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { InfluencersScreen } from './InfluencersScreen';

function buildInfluencer(overrides: Partial<Influencer> = {}): Influencer {
  return {
    id: 'influencer-1',
    name: 'ليان المعمري',
    handle: handle('layan.style'),
    bio: 'أزياء وإطلالات يومية',
    avatarUrl: null,
    followers: followerCount(215_000),
    postCount: 128,
    productCount: 46,
    following: false,
    ...overrides,
  };
}

/**
 * Stateful on purpose: the follow relationship is server state, so a fake that forgets it would
 * let an optimistic-only implementation pass the persistence half of AC11.5.
 */
function repository(
  overrides: Partial<InfluencerRepository> = {},
): jest.Mocked<InfluencerRepository> {
  let following = false;
  return {
    list: jest.fn(async () => ok([buildInfluencer({ following })])),
    getById: jest.fn(async () => ok(buildInfluencer({ following }))),
    listPosts: jest.fn(async () => ok([])),
    follow: jest.fn(async () => {
      following = true;
      return ok(undefined);
    }),
    unfollow: jest.fn(async () => {
      following = false;
      return ok(undefined);
    }),
    ...overrides,
  } as unknown as jest.Mocked<InfluencerRepository>;
}

async function mount({
  port = repository(),
  authenticated = true,
}: { port?: jest.Mocked<InfluencerRepository>; authenticated?: boolean } = {}) {
  const onOpenInfluencer = jest.fn();
  const onRequireAuth = jest.fn();
  const onFollowFailed = jest.fn();
  await renderWithProviders(
    <InfluencersScreen
      getInfluencers={new GetInfluencersUseCase(port)}
      followInfluencer={new FollowInfluencerUseCase(port)}
      authenticated={authenticated}
      onRequireAuth={onRequireAuth}
      onFollowFailed={onFollowFailed}
      onOpenInfluencer={onOpenInfluencer}
    />,
  );
  return { port, onOpenInfluencer, onRequireAuth, onFollowFailed };
}

describe('InfluencersScreen', () => {
  it('AC11.1 — shows every influencer with name, handle and a compact follower count', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByText('ليان المعمري')).toBeOnTheScreen(),
    );
    expect(screen.getByText('@layan.style · 215K')).toBeOnTheScreen();
  });

  it('AC11.2 — opens the tapped influencer’s profile', async () => {
    const { onOpenInfluencer } = await mount();

    await waitFor(() =>
      expect(screen.getByText('ليان المعمري')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('ليان المعمري'));

    expect(onOpenInfluencer).toHaveBeenCalledWith('influencer-1');
  });

  it('AC11.5 — the follow button toggles and persists through the repository', async () => {
    const { port } = await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('متابعة')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('متابعة'));

    await waitFor(() =>
      expect(port.follow).toHaveBeenCalledWith('influencer-1'),
    );
    // The row states the new relationship, and still does once the refetch has landed.
    await waitFor(() =>
      expect(screen.getByLabelText('تتابعه')).toBeOnTheScreen(),
    );
  });

  it('unfollows on a second tap rather than following twice', async () => {
    const { port } = await mount({
      port: repository({
        list: jest.fn(async () => ok([buildInfluencer({ following: true })])),
      }),
    });

    await waitFor(() =>
      expect(screen.getByLabelText('تتابعه')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('تتابعه'));

    await waitFor(() =>
      expect(port.unfollow).toHaveBeenCalledWith('influencer-1'),
    );
    expect(port.follow).not.toHaveBeenCalled();
  });

  it('D3 — sends a guest to sign in instead of following optimistically', async () => {
    const { port, onRequireAuth } = await mount({ authenticated: false });

    await waitFor(() =>
      expect(screen.getByLabelText('متابعة')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('متابعة'));

    expect(onRequireAuth).toHaveBeenCalled();
    expect(port.follow).not.toHaveBeenCalled();
  });

  it('restores the previous relationship and reports a failed follow', async () => {
    const { onFollowFailed } = await mount({
      port: repository({
        follow: jest.fn(async () =>
          err(
            new ServerError(500, {
              code: 'SERVER',
              message: 'boom',
              correlationId: 'cor-social',
            }),
          ),
        ),
      }),
    });

    await waitFor(() =>
      expect(screen.getByLabelText('متابعة')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('متابعة'));

    await waitFor(() => expect(onFollowFailed).toHaveBeenCalled());
    expect(screen.getByLabelText('متابعة')).toBeOnTheScreen();
  });

  it('offers a retry when the directory cannot be read', async () => {
    const { port } = await mount({
      port: repository({
        list: jest.fn(async () =>
          err(
            new ServerError(503, {
              code: 'SERVER',
              message: 'down',
              correlationId: 'cor-social',
            }),
          ),
        ),
      }),
    });

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await waitFor(() => expect(port.list).toHaveBeenCalledTimes(2));
  });
});
