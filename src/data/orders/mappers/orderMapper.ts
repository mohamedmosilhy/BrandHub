import { Money } from '@core/money';

import type {
  Order,
  OrderStatus,
  ReturnReason,
  ReturnRequest,
} from '@domain/orders';

import { mapCart } from '@data/cart/mappers';
import type { AssetUrlResolver } from '@data/catalog/mappers';
import type { OrderDto, ReturnRequestDto } from '@data/orders/dto';

const statuses = new Set<OrderStatus>([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export function mapOrder(dto: OrderDto, resolveUrl?: AssetUrlResolver): Order {
  const cart = mapCart(
    {
      id: `cart-order-${dto.id}`,
      userId: dto.userId,
      items: dto.items,
      subtotal: dto.subtotal,
      currency: 'OMR',
    },
    resolveUrl,
  );
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status: statuses.has(dto.status as OrderStatus)
      ? (dto.status as OrderStatus)
      : 'UNKNOWN',
    lines: cart.lines,
    subtotal: Money.fromDecimal(dto.subtotal),
    vat: Money.fromDecimal(dto.vat),
    shipping: Money.fromDecimal(dto.shipping),
    paymentFee: Money.fromDecimal(dto.paymentFee),
    discount: Money.fromDecimal(dto.discount),
    total: Money.fromDecimal(dto.total),
    shippingAddressId: dto.shippingAddressId,
    paymentMethod: dto.paymentMethod,
    deliveryOtp: dto.deliveryOtp,
    createdAt: dto.createdAt,
  };
}

/**
 * The five fixed UI reasons the prototype offers, rendered as the free text `POST /returns`
 * actually takes (D19). The note the customer typed is appended, so nothing they wrote is
 * dropped on the way to a contract that has one string for both.
 */
const RETURN_REASON_TEXT: Record<ReturnReason, string> = {
  NOT_AS_DESCRIBED: 'Not as described',
  DAMAGED: 'Arrived damaged',
  WRONG_SIZE: 'Wrong size',
  CHANGED_MIND: 'Changed my mind',
  OTHER: 'Other reason',
};

export function returnReasonText(reason: ReturnReason, note?: string): string {
  const detail = note?.trim();
  return detail
    ? `${RETURN_REASON_TEXT[reason]}: ${detail}`
    : RETURN_REASON_TEXT[reason];
}

export function mapReturnRequest(dto: ReturnRequestDto): ReturnRequest {
  return {
    id: dto.id,
    returnNumber: dto.returnNumber,
    orderId: dto.orderId,
    reason: dto.reason,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}
