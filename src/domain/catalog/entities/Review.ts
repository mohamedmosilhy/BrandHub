import type { Rating } from './Product';

export type Review = Readonly<{
  id: string;
  productId: string;
  /** The reviewer's display name; the API resolves it so the PDP issues no per-review request. */
  authorName: string;
  rating: Rating;
  comment: string;
  createdAt: string;
}>;
