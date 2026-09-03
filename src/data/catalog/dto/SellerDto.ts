import { z } from 'zod';

export const sellerDtoSchema = z.strictObject({
  id: z.string().min(1),
  /** The contract carries both an id and a uuid on a seller; only the id is addressable. */
  sellerUuid: z.string().min(1).optional(),
  storeName: z.string().min(1),
  verified: z.boolean(),
  averageRating: z.number().min(0).max(5),
  salesCount: z.number().nonnegative(),
  profileImageUrl: z.string().nullish(),
});

export const sellerPageDtoSchema = z.strictObject({
  content: z.array(sellerDtoSchema),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  number: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  first: z.boolean(),
  last: z.boolean(),
});

export type SellerDto = z.infer<typeof sellerDtoSchema>;
export type SellerPageDto = z.infer<typeof sellerPageDtoSchema>;
