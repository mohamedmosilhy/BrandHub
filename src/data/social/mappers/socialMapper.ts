import {
  followerCount,
  handle,
  type Influencer,
  type ShoppablePost,
} from '@domain/social';

import { mapProduct, type AssetUrlResolver } from '@data/catalog/mappers';
import type { InfluencerDto, ShoppablePostDto } from '@data/social/dto';

export function mapInfluencer(
  dto: InfluencerDto,
  resolveUrl?: AssetUrlResolver,
): Influencer {
  return {
    id: dto.id,
    name: dto.name,
    handle: handle(dto.handle),
    bio: dto.bio,
    avatarUrl:
      dto.avatarUrl === null
        ? null
        : (resolveUrl?.(dto.avatarUrl) ?? dto.avatarUrl),
    followers: followerCount(dto.followerCount),
    postCount: dto.postCount,
    productCount: dto.productCount,
    following: dto.isFollowing,
  };
}

/**
 * Post-to-product resolution. `products` is the join the server already made; `productIds` is
 * kept as the membership statement, so an id the server tagged but could not resolve — a product
 * that was withdrawn, say — narrows the card rather than leaving a broken tile behind.
 */
export function mapShoppablePost(
  dto: ShoppablePostDto,
  resolveUrl?: AssetUrlResolver,
): ShoppablePost {
  const tagged = new Set(dto.productIds);
  return {
    id: dto.id,
    influencerId: dto.influencerId,
    imageUrl:
      dto.imageUrl === null
        ? null
        : (resolveUrl?.(dto.imageUrl) ?? dto.imageUrl),
    caption: dto.caption,
    likes: dto.likeCount,
    comments: dto.commentCount,
    products: dto.products
      .filter((product) => tagged.has(product.id))
      .map((product) => mapProduct(product, resolveUrl)),
    createdAt: dto.createdAt,
  };
}
