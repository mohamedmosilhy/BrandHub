import { z } from 'zod';

export const reviewDtoSchema = z.strictObject({
  id: z.string().min(1),
  userId: z.string().min(1),
  productId: z.string().min(1),
  /** Resolved server-side so a review list never fans out into per-reviewer requests. */
  userName: z.string(),
  rating: z.number().min(0).max(5),
  comment: z.string(),
  createdAt: z.string().min(1),
});

export const reviewPageDtoSchema = z.strictObject({
  content: z.array(reviewDtoSchema),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  number: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  first: z.boolean(),
  last: z.boolean(),
});

export type ReviewDto = z.infer<typeof reviewDtoSchema>;
export type ReviewPageDto = z.infer<typeof reviewPageDtoSchema>;
