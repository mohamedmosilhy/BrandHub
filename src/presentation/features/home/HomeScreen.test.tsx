import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  GetProductDetailUseCase,
  type CategoryRepository,
  type ProductRepository,
} from '@domain/catalog';
import {
  GetNotificationsUseCase,
  type AppNotification,
  type NotificationRepository,
} from '@domain/notifications';
import {
  GetInfluencersUseCase,
  followerCount,
  handle,
  type Influencer,
  type InfluencerRepository,
} from '@domain/social';

import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { HomeScreen } from './HomeScreen';

const serverError = new ServerError(500, {
  code: 'SERVER_ERROR',
  message: 'failed',
  correlationId: 'cor-home',
});

const influencer: Influencer = {
  id: 'influencer-1',
  name: 'ليان المعمري',
  handle: handle('layan.style'),
  bio: 'أزياء وإطلالات يومية',
  avatarUrl: null,
  followers: followerCount(215_000),
  postCount: 128,
  productCount: 46,
  following: false,
};

function catalogue(product = buildProduct()) {
  const products: ProductRepository = {
    search: jest.fn(async (_criteria, page, size = 20) =>
      ok({ items: [product], page, size, total: 1, hasNext: false }),
    ),
    getById: jest.fn(async () => ok(product)),
    getRelated: jest.fn(async () => ok([])),
    getByCategory: jest.fn(async (_id, page, _criteria, size = 20) =>
      ok({ items: [product], page, size, total: 1, hasNext: false }),
    ),
    getBestSellers: jest.fn(async () => ok([product])),
    getNewArrivals: jest.fn(async () => ok([product])),
    getFeatured: jest.fn(async () => ok([product])),
  };
  return products;
}

async function mountHome({
  categories,
  notifications = [],
  authenticated = true,
}: {
  categories?: CategoryRepository;
  notifications?: readonly AppNotification[];
  authenticated?: boolean;
} = {}) {
  const product = buildProduct();
  const products = catalogue(product);
  const categoryRepository: CategoryRepository = categories ?? {
    getTree: jest.fn(async () => ok([])),
    getById: jest.fn(async () => err(serverError)),
  };
  const influencers = {
    list: jest.fn(async () => ok([influencer])),
    getById: jest.fn(async () => ok(influencer)),
    listPosts: jest.fn(async () => ok([])),
    follow: jest.fn(async () => ok(undefined)),
    unfollow: jest.fn(async () => ok(undefined)),
  } as unknown as jest.Mocked<InfluencerRepository>;
  const notificationRepository = {
    list: jest.fn(async () => ok(notifications)),
    markAllRead: jest.fn(async () => ok(0)),
  } as unknown as jest.Mocked<NotificationRepository>;
  const onOpenInfluencer = jest.fn();

  await renderWithProviders(
    <HomeScreen
      categoryRepository={categoryRepository}
      productRepository={products}
      getProductDetail={new GetProductDetailUseCase(products)}
      getInfluencers={new GetInfluencersUseCase(influencers)}
      getNotifications={new GetNotificationsUseCase(notificationRepository)}
      authenticated={authenticated}
      onSearch={jest.fn()}
      onNotifications={jest.fn()}
      onBrowse={jest.fn()}
      onOpenCategory={jest.fn()}
      onOpenProduct={jest.fn()}
      onOpenInfluencer={onOpenInfluencer}
    />,
  );
  return { product, influencers, notificationRepository, onOpenInfluencer };
}

describe('HomeScreen', () => {
  it('keeps the deals section visible when categories fail independently', async () => {
    const { product } = await mountHome({
      categories: {
        getTree: jest.fn(async () => err(serverError)),
        getById: jest.fn(async () => err(serverError)),
      },
    });

    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
    expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen();
  });

  it('AC11.6 — renders the influencer rail from the repository and opens a profile', async () => {
    const { influencers, onOpenInfluencer } = await mountHome();

    // The prototype labels a rail avatar with the first name alone.
    await waitFor(() => expect(screen.getByText('ليان')).toBeOnTheScreen());
    expect(influencers.list).toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('ليان المعمري'));
    expect(onOpenInfluencer).toHaveBeenCalledWith('influencer-1');
  });

  it('AC11.8 — the bell shows its dot only while something is unread', async () => {
    await mountHome({
      notifications: [
        {
          id: 'notification-1',
          kind: 'ORDER',
          title: 'طلب',
          body: 'جارٍ التجهيز',
          read: false,
          createdAt: '2026-09-02T11:55:00.000Z',
        },
      ],
    });

    await waitFor(() =>
      expect(screen.getByTestId('home-unread-dot')).toBeOnTheScreen(),
    );
  });

  it('hides the dot once everything has been read', async () => {
    await mountHome({
      notifications: [
        {
          id: 'notification-1',
          kind: 'ORDER',
          title: 'طلب',
          body: 'جارٍ التجهيز',
          read: true,
          createdAt: '2026-09-02T11:55:00.000Z',
        },
      ],
    });

    await waitFor(() => expect(screen.getByText('ليان')).toBeOnTheScreen());
    expect(screen.queryByTestId('home-unread-dot')).not.toBeOnTheScreen();
  });

  it('D3 — a guest is never asked for notifications, so the dot never appears', async () => {
    const { notificationRepository } = await mountHome({
      authenticated: false,
    });

    await waitFor(() => expect(screen.getByText('ليان')).toBeOnTheScreen());
    expect(notificationRepository.list).not.toHaveBeenCalled();
    expect(screen.queryByTestId('home-unread-dot')).not.toBeOnTheScreen();
  });
});
