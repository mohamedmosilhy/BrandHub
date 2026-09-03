import { z } from 'zod';

export const productImageDtoSchema = z.strictObject({
  id: z.string().min(1),
  url: z.string().min(1),
  alt: z.string(),
});

export const productVariantDtoSchema = z.strictObject({
  id: z.string().min(1),
  sku: z.string().min(1),
  attributes: z.record(z.string(), z.string()),
  stock: z.number().nonnegative(),
  price: z.number().nonnegative(),
});

export const productDtoSchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().min(1),
  sellerId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  basePrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative().nullable(),
  currency: z.literal('OMR'),
  stock: z.number().nonnegative(),
  featured: z.boolean(),
  createdAt: z.string().min(1),
  salesCount: z.number().nonnegative(),
  averageRating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  images: z.array(productImageDtoSchema),
  variants: z.array(productVariantDtoSchema),
  specs: z.array(z.strictObject({ name: z.string(), value: z.string() })),
});

export const productListDtoSchema = z.array(productDtoSchema);

export const productPageDtoSchema = z.strictObject({
  content: z.array(productDtoSchema),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  number: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  first: z.boolean(),
  last: z.boolean(),
});

export type ProductDto = z.infer<typeof productDtoSchema>;
export type ProductPageDto = z.infer<typeof productPageDtoSchema>;
