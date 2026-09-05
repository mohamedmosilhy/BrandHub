/** @jest-environment node */

import { NotFoundError } from '@core/errors';

import type { InfluencerDto, ShoppablePostDto } from '@data/social/dto';

import type {
  HttpClient,
  HttpResponse,
  RequestConfig,
} from '@infrastructure/http';

import { InfluencerRemoteDataSource } from '../datasources';

import { MockInfluencerRepository } from './MockInfluencerRepository';

function influencerDto(overrides: Partial<InfluencerDto> = {}): InfluencerDto {
  return {
    id: 'influencer-1',
    name: 'Layan Al Maamari',
    handle: '@layan.style',
    bio: 'Fashion & daily looks · Muscat',
    avatarUrl: null,
    followerCount: 215_000,
    postCount: 128,
    productCount: 46,
    taggedProductIds: ['product-9'],
    isFollowing: false,
    ...overrides,
  };
}

function productDto(id: string) {
  return {
    id,
    slug: `fashion-${id}`,
    categoryId: 'cat-fashion',
    sellerId: 'seller-a2',
    name: 'Lightweight running shoes',
    description: 'A curated product',
    basePrice: 23.4,
    salePrice: 19.9,
    currency: 'OMR' as const,
    stock: 8,
    featured: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    salesCount: 40,
    averageRating: 4.5,
    reviewCount: 12,
    images: [
      { id: `${id}-image-1`, url: '/api/v1/mock-assets/p9.png', alt: 'Shoe' },
    ],
    variants: [
      {
        id: `${id}-default`,
        sku: 'BH-00009-D',
        attributes: { colour: 'Black' },
        stock: 6,
        price: 19.9,
      },
    ],
    specs: [],
  };
}

function postDto(overrides: Partial<ShoppablePostDto> = {}): ShoppablePostDto {
  return {
    id: 'post-1',
    influencerId: 'influencer-1',
    imageUrl: '/api/v1/mock-assets/product-9.png',
    caption: 'Today’s look',
    likeCount: 2_400,
    commentCount: 86,
    productIds: ['product-9'],
    products: [productDto('product-9')],
    createdAt: '2026-09-02T12:00:00.000Z',
    ...overrides,
  };
}

const page = <T>(content: T[]) => ({
  content,
  number: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
});

class FakeHttpClient implements HttpClient {
  readonly requests: RequestConfig[] = [];
  responder: (config: RequestConfig) => unknown = () => undefined;

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    this.requests.push(config);
    return {
      data: this.responder(config) as T,
      status: 200,
      headers: {},
      correlationId: 'cor-social',
    };
  }
}

function fixture() {
  const http = new FakeHttpClient();
  const repository = new MockInfluencerRepository(
    new InfluencerRemoteDataSource(http),
    (value) => `https://cdn.test${value}`,
  );
  return { http, repository };
}

describe('MockInfluencerRepository.list', () => {
  it('maps the directory page onto domain influencers', async () => {
    const { http, repository } = fixture();
    http.responder = () =>
      page([
        influencerDto(),
        influencerDto({ id: 'influencer-2', isFollowing: true }),
      ]);

    const result = await repository.list();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value[0]).toMatchObject({
      id: 'influencer-1',
      handle: '@layan.style',
      followers: 215_000,
      postCount: 128,
      productCount: 46,
      following: false,
    });
    expect(result.value[1]?.following).toBe(true);
    expect(http.requests[0]).toMatchObject({
      method: 'GET',
      endpoint: '/influencers',
      query: { page: 0, size: 20 },
    });
  });

  it('reports a contract mismatch as a failed result rather than throwing', async () => {
    const { http, repository } = fixture();
    http.responder = () => page([{ id: 'influencer-1' }]);

    expect((await repository.list()).ok).toBe(false);
  });
});

describe('MockInfluencerRepository.listPosts', () => {
  it('asks only for the open influencer’s feed and resolves the tagged products', async () => {
    const { http, repository } = fixture();
    http.responder = () => page([postDto()]);

    const result = await repository.listPosts('influencer-1');

    expect(http.requests[0]).toMatchObject({
      endpoint: '/posts',
      query: { influencerId: 'influencer-1', page: 0, size: 20 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const post = result.value[0];
    expect(post).toMatchObject({ likes: 2_400, comments: 86 });
    expect(post?.imageUrl).toBe(
      'https://cdn.test/api/v1/mock-assets/product-9.png',
    );
    expect(post?.products.map((product) => product.id)).toEqual(['product-9']);
    expect(post?.products[0]?.price.toDecimal()).toBe(19.9);
  });

  it('drops an embedded product the post does not actually tag', async () => {
    const { http, repository } = fixture();
    http.responder = () =>
      page([
        postDto({
          productIds: ['product-9'],
          products: [productDto('product-9'), productDto('product-404')],
        }),
      ]);

    const result = await repository.listPosts('influencer-1');

    expect(result.ok && result.value[0]?.products).toHaveLength(1);
  });
});

describe('MockInfluencerRepository follow', () => {
  it('follows and unfollows on the same invented route', async () => {
    const { http, repository } = fixture();

    expect((await repository.follow('influencer-1')).ok).toBe(true);
    expect((await repository.unfollow('influencer-1')).ok).toBe(true);
    expect(http.requests).toEqual([
      { method: 'POST', endpoint: '/influencers/influencer-1/follow' },
      { method: 'DELETE', endpoint: '/influencers/influencer-1/follow' },
    ]);
  });

  it('returns the API error rather than throwing it at the screen', async () => {
    const { http, repository } = fixture();
    const notFound = new NotFoundError({
      code: 'INFLUENCER_NOT_FOUND',
      message: 'Influencer was not found',
      correlationId: 'cor-social',
    });
    http.responder = () => {
      throw notFound;
    };

    const result = await repository.getById('influencer-404');

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toBe(notFound);
  });
});
