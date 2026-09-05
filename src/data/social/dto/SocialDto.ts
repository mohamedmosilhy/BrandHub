import { z } from 'zod';

import { productDtoSchema } from '@data/catalog/dto';

/**
 * The invented social contract (GAP-1 / FA1). These schemas are the specification handed to the
 * backend as much as they are validation, so they are strict: a field the mock host invented and
 * the real API drops must fail loudly at the boundary rather than render as `undefined`.
 */
export const influencerDtoSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  handle: z.string().min(1),
  bio: z.string(),
  avatarUrl: z.string().min(1).nullable(),
  followerCount: z.number().nonnegative(),
  postCount: z.number().int().nonnegative(),
  productCount: z.number().int().nonnegative(),
  taggedProductIds: z.array(z.string().min(1)),
  isFollowing: z.boolean(),
});

export const shoppablePostDtoSchema = z.strictObject({
  id: z.string().min(1),
  influencerId: z.string().min(1),
  imageUrl: z.string().min(1).nullable(),
  caption: z.string(),
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  productIds: z.array(z.string().min(1)),
  /** Embedded so a feed never fans out into one product request per tagged item. */
  products: z.array(productDtoSchema),
  createdAt: z.string().min(1),
});

const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    number: z.number().int().nonnegative(),
    size: z.number().int().nonnegative(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });

export const influencerPageDtoSchema = pageOf(influencerDtoSchema);
export const shoppablePostPageDtoSchema = pageOf(shoppablePostDtoSchema);

export const followDtoSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  influencerId: z.string().min(1),
  createdAt: z.string().min(1),
});

export type InfluencerDto = z.infer<typeof influencerDtoSchema>;
export type ShoppablePostDto = z.infer<typeof shoppablePostDtoSchema>;
