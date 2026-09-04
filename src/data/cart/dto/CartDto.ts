import { z } from 'zod';

import { productDtoSchema, productVariantDtoSchema } from '@data/catalog/dto';

export const cartLineDtoSchema = z.strictObject({
  id: z.string().min(1),
  userId: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  product: productDtoSchema,
  variant: productVariantDtoSchema,
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});

export const cartDtoSchema = z.strictObject({
  id: z.string().min(1),
  userId: z.string().min(1),
  items: z.array(cartLineDtoSchema),
  subtotal: z.number().nonnegative(),
  currency: z.literal('OMR'),
});

export type CartDto = z.infer<typeof cartDtoSchema>;
export type CartLineDto = z.infer<typeof cartLineDtoSchema>;
