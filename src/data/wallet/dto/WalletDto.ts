import { z } from 'zod';

export const walletDtoSchema = z.object({
  userId: z.string().min(1),
  balance: z.number(),
  currency: z.literal('OMR'),
});

/**
 * `type` is a plain string, not an enum: an unrecognised movement of the customer's own money must
 * render as a neutral row rather than fail a page of history. The mapper narrows it.
 */
export const walletTransactionDtoSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: z.string().min(1),
  amount: z.number(),
  currency: z.literal('OMR'),
  description: z.string(),
  createdAt: z.string().min(1),
});

export const walletTransactionPageDtoSchema = z.object({
  content: z.array(walletTransactionDtoSchema),
  number: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

/**
 * `POST /wallet/charge`. The collection's own test script reads `paymentUrl`, `gateway` and
 * `referenceId`, so those three are contracted. `gatewayOrderId` is a **mock addition** the
 * backend is asked to include: `GET /payments/PAYMOB/status?orderId=` needs a key the client can
 * only get from here, and the collection never hands it over. See `INVENTED_ENDPOINTS.md`.
 */
export const walletChargeDtoSchema = z.object({
  id: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.literal('OMR'),
  status: z.string().min(1),
  gateway: z.string().min(1),
  paymentUrl: z.string().min(1),
  referenceId: z.string().min(1),
  gatewayOrderId: z.string().min(1),
  createdAt: z.string().min(1),
});

export const paymentStatusDtoSchema = z.object({
  orderId: z.string().min(1),
  status: z.string().min(1),
});

export const giftDtoSchema = z.object({
  id: z.string().min(1),
  senderId: z.string().min(1),
  recipient: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.literal('OMR'),
  occasion: z.string(),
  message: z.string(),
  deliveryMethod: z.string().min(1),
  senderMode: z.string().min(1),
  scheduledAt: z.string().nullable(),
  status: z.string().min(1),
  createdAt: z.string().min(1),
});

export type WalletDto = z.infer<typeof walletDtoSchema>;
export type WalletTransactionDto = z.infer<typeof walletTransactionDtoSchema>;
export type WalletChargeDto = z.infer<typeof walletChargeDtoSchema>;
export type GiftDto = z.infer<typeof giftDtoSchema>;
