import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  FollowInfluencerUseCase,
  followerCount,
  GetInfluencerProfileUseCase,
  handle,
  type Influencer,
  type InfluencerRepository,
  type ShoppablePost,
} from '@domain/social';

import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { InfluencerProfileScreen } from './InfluencerProfileScreen';

const product = buildProduct({ id: 'product-9', title: 'حذاء رياضي خفيف' });

const influencer: Influencer = {
  id: 'influencer-1',
  name: 'ليان المعمري',
  handle: handle('layan.style'),
  bio: 'أزياء وإطلالات يومية · مسقط',
  avatarUrl: null,
  followers: followerCount(215_000),
  postCount: 128,
  productCount: 46,
  following: false,
};

const post: ShoppablePost = {
  id: 'post-1',
  influencerId: 'influencer-1',
  imageUrl: '/api/v1/mock-assets/product-9.png',
  caption: 'إطلالة اليوم بالكامل من المتجر',
  likes: 2_400,
  comments: 86,
  products: [product],
  createdAt: '2026-09-02T12:00:00.000Z',
};

function repository(
  overrides: Partial<InfluencerRepository> = {},
): jest.Mocked<InfluencerRepository> {
  return {
    list: jest.fn(async () => ok([influencer])),
    getById: jest.fn(async () => ok(influencer)),
    listPosts: jest.fn(async () => ok([post])),
    follow: jest.fn(async () => ok(undefined)),
    unfollow: jest.fn(async () => ok(undefined)),
    ...overrides,
  } as unknown as jest.Mocked<InfluencerRepository>;
}

async function mount(port = repository()) {
  const onOpenProduct = jest.fn();
  const onMessageUnavailable = jest.fn();
  await renderWithProviders(
    <InfluencerProfileScreen
      influencerId="influencer-1"
      getInfluencerProfile={new GetInfluencerProfileUseCase(port)}
      followInfluencer={new FollowInfluencerUseCase(port)}
      authenticated
      onRequireAuth={jest.fn()}
      onFollowFailed={jest.fn()}
      onMessageUnavailable={onMessageUnavailable}
      onBack={jest.fn()}
      onOpenProduct={onOpenProduct}
    />,
  );
  return { port, onOpenProduct, onMessageUnavailable };
}

describe('InfluencerProfileScreen', () => {
  it('AC11.2 — shows the bio and the three stats', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByText('ليان المعمري')).toBeOnTheScreen(),
    );
    expect(screen.getByText('@layan.style')).toBeOnTheScreen();
    expect(screen.getByText('أزياء وإطلالات يومية · مسقط')).toBeOnTheScreen();
    expect(screen.getByText('128')).toBeOnTheScreen();
    expect(screen.getByText('215K')).toBeOnTheScreen();
    expect(screen.getByText('46')).toBeOnTheScreen();
  });

  it('AC11.3 — loads the feed with its likes, comments and caption', async () => {
    const { port } = await mount();

    await waitFor(() =>
      expect(
        screen.getByText('إطلالة اليوم بالكامل من المتجر'),
      ).toBeOnTheScreen(),
    );
    expect(screen.getByText('2.4K')).toBeOnTheScreen();
    expect(screen.getByText('86')).toBeOnTheScreen();
    expect(port.listPosts).toHaveBeenCalledWith('influencer-1');
  });

  it('AC11.4 — opens the PDP of the product a post tags', async () => {
    const { onOpenProduct } = await mount();

    await waitFor(() =>
      expect(
        screen.getByLabelText('عرض المنتج — حذاء رياضي خفيف'),
      ).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('عرض المنتج — حذاء رياضي خفيف'));

    expect(onOpenProduct).toHaveBeenCalledWith('product-9');
  });

  it('AC11.5 — the profile’s follow action reaches the repository', async () => {
    const { port } = await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('متابعة')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('متابعة'));

    await waitFor(() =>
      expect(port.follow).toHaveBeenCalledWith('influencer-1'),
    );
  });

  it('says messaging is out of scope rather than opening a dead screen', async () => {
    const { onMessageUnavailable } = await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('رسالة')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('رسالة'));

    expect(onMessageUnavailable).toHaveBeenCalled();
  });

  it('fails the whole profile — header included — when the feed cannot be read', async () => {
    await mount(
      repository({
        listPosts: jest.fn(async () =>
          err(
            new ServerError(500, {
              code: 'SERVER',
              message: 'boom',
              correlationId: 'cor-social',
            }),
          ),
        ),
      }),
    );

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('ليان المعمري')).not.toBeOnTheScreen();
  });
});
