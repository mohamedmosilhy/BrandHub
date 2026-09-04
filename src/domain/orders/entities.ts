import type { Money } from '@core/money';

import type { CartLine } from '@domain/cart';
import type { PaymentMethod } from '@domain/checkout';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'UNKNOWN';

export type Order = Readonly<{
  id: string;
  orderNumber: string;
  status: OrderStatus;
  lines: readonly CartLine[];
  subtotal: Money;
  vat: Money;
  shipping: Money;
  paymentFee: Money;
  discount: Money;
  total: Money;
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  deliveryOtp: string | null;
  createdAt: string;
}>;

export type OrderLine = Order['lines'][number];
export type DeliveryOtp = string;

export type OrderTimelineStep =
  'CREATED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

export type OrderTimeline = Readonly<{
  key: OrderTimelineStep;
  complete: boolean;
}>;

const STEPS: readonly OrderTimelineStep[] = [
  'CREATED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

/**
 * How far along the four-step timeline each status sits. `CANCELLED` and `UNKNOWN` complete no
 * step: a cancelled order never reached delivery, and an unrecognised status must not claim
 * progress it cannot prove.
 */
const REACHED: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: -1,
  UNKNOWN: -1,
};

export function orderTimeline(status: OrderStatus): readonly OrderTimeline[] {
  const reached = REACHED[status];
  return STEPS.map((key, index) => ({ key, complete: index <= reached }));
}

export type ReturnReason =
  'NOT_AS_DESCRIBED' | 'DAMAGED' | 'WRONG_SIZE' | 'CHANGED_MIND' | 'OTHER';

export type ReturnRequest = Readonly<{
  id: string;
  returnNumber: string;
  orderId: string;
  reason: string;
  status: string;
  createdAt: string;
}>;
