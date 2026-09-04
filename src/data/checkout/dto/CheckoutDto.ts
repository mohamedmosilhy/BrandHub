import { z } from 'zod';

export const couponDtoSchema = z.strictObject({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().nonnegative(),
  minimumOrder: z.number().nonnegative(),
  maximumDiscount: z.number().nonnegative(),
  active: z.boolean(),
  startsAt: z.string().min(1),
  expiresAt: z.string().min(1),
});

export const couponValidationDtoSchema = z.strictObject({
  valid: z.literal(true),
  coupon: couponDtoSchema,
});

export const shippingAreaDtoSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  governorate: z.string().min(1),
  shippingPrice: z.number().nonnegative(),
  minOrderAmount: z.number().nonnegative(),
  estimatedDeliveryDays: z.number().int().positive(),
  active: z.boolean(),
});

export const shippingAreaListDtoSchema = z.array(shippingAreaDtoSchema);

export const shippingAddressDtoSchema = z.strictObject({
  id: z.string().min(1),
  userId: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullish(),
  city: z.string().min(1),
  state: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().min(1),
  areaId: z.string().min(1),
  isDefault: z.boolean(),
});

export const shippingAddressListDtoSchema = z.array(shippingAddressDtoSchema);

export type CouponDto = z.infer<typeof couponDtoSchema>;
export type ShippingAreaDto = z.infer<typeof shippingAreaDtoSchema>;
export type ShippingAddressDto = z.infer<typeof shippingAddressDtoSchema>;
