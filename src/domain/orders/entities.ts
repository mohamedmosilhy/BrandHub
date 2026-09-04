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
