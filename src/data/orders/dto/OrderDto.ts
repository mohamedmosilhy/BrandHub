import { z } from 'zod';

import { cartLineDtoSchema } from '@data/cart/dto';

export const orderDtoSchema = z.strictObject({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  userId: z.string().min(1),
  status: z.string().min(1),
  items: z.array(cartLineDtoSchema),
  subtotal: z.number().nonnegative(),
  vat: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  paymentFee: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currency: z.literal('OMR'),
  shippingAddressId: z.string().min(1),
  paymentMethod: z.enum([
    'THAWANI',
    'CREDIT_CARD',
    'APPLE_PAY',
    'CASH_ON_DELIVERY',
  ]),
  walletPayment: z.boolean(),
  notes: z.string().nullable(),
  deliveryOtp: z.string().nullable(),
  createdAt: z.string().min(1),
});

export type OrderDto = z.infer<typeof orderDtoSchema>;
