import { Money } from '@core/money';

export type PaymentMethod =
  'THAWANI' | 'CREDIT_CARD' | 'APPLE_PAY' | 'CASH_ON_DELIVERY';

export type ShippingArea = Readonly<{
  id: string;
  name: string;
  governorate: string;
  shippingPrice: Money;
  minOrderAmount: Money;
  estimatedDeliveryDays: number;
}>;

export type ShippingAddress = Readonly<{
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  areaId: string | null;
  isDefault: boolean;
}>;

export type Coupon = Readonly<{
  id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumOrder: Money;
  maximumDiscount: Money;
  expiresAt: string;
}>;

export type CheckoutDraft = Readonly<{
  shippingAddressId: string | null;
  paymentMethod: PaymentMethod | null;
  coupon: Coupon | null;
}>;

export type CartTotals = Readonly<{
  subtotal: Money;
  vat: Money;
  shipping: Money;
  paymentFee: Money;
  discount: Money;
  total: Money;
  freeShippingRemaining: Money;
}>;

export const paymentMethodFee = (method: PaymentMethod | null): Money =>
  Money.fromDecimal(method === 'CASH_ON_DELIVERY' ? '0.500' : '0.000');
