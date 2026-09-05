import type { Product } from '@domain/catalog';

/**
 * A handle is rendered LTR next to a name that may be Arabic, and the prototype always prints it
 * with a leading `@`. The API has no contract for it yet (GAP-1 / FA1), so the shape is enforced
 * here rather than trusted from a payload the backend has not specified.
 */
export type Handle = string & { readonly __brand: 'Handle' };

export function handle(value: string): Handle {
  return `@${value.trim().replace(/^@+/, '')}` as Handle;
}

/**
 * Followers are counted, never measured: a fractional or negative count is a server mistake, and
 * the profile's stat row would print it verbatim. The value object floors it once, at the edge.
 */
export type FollowerCount = number & { readonly __brand: 'FollowerCount' };

export function followerCount(value: number): FollowerCount {
  return (
    Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  ) as FollowerCount;
}

export type Influencer = Readonly<{
  id: string;
  name: string;
  handle: Handle;
  bio: string;
  /** `null` where the influencer has no picture; the avatar then falls back to their initial. */
  avatarUrl: string | null;
  followers: FollowerCount;
  /** The profile's three stats. All three are the server's counts, never derived from a page. */
  postCount: number;
  productCount: number;
  following: boolean;
}>;

/**
 * A post carries the products it tags, not their ids. The invented `GET /posts` embeds them
 * (§18.2), so opening a feed never fans out into one product request per tagged item — the N+1
 * D14 already rejected for card ratings.
 */
export type ShoppablePost = Readonly<{
  id: string;
  influencerId: string;
  imageUrl: string | null;
  caption: string;
  likes: number;
  comments: number;
  products: readonly Product[];
  createdAt: string;
}>;

export type InfluencerProfile = Readonly<{
  influencer: Influencer;
  posts: readonly ShoppablePost[];
}>;
