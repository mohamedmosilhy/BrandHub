import { DomainError, type AppError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok, type Result } from '@core/result';

import { cartSubtotal, type Cart } from '@domain/cart';

import {
  paymentMethodFee,
  type CartTotals,
  type Coupon,
  type PaymentMethod,
  type ShippingArea,
} from './entities';
import type { CouponRepository } from './repositories';

function invalidCoupon(message: string) {
  return new DomainError({
    code: 'INVALID_COUPON',
    message,
    correlationId: 'domain-checkout',
  });
}

export class CalculateCartTotalsUseCase {
  execute(
    cart: Cart,
    area: ShippingArea | null,
    paymentMethod: PaymentMethod | null,
    coupon: Coupon | null,
  ): CartTotals {
    const subtotal = cartSubtotal(cart);
    const vat = subtotal.percentage(5);
    const qualifiesForFreeShipping = Boolean(
      area && subtotal.compare(area.minOrderAmount) >= 0,
    );
    const shipping = area
      ? qualifiesForFreeShipping
        ? Money.zero()
        : area.shippingPrice
      : Money.zero();
    const freeShippingRemaining = area
      ? subtotal.compare(area.minOrderAmount) < 0
        ? area.minOrderAmount.minus(subtotal)
        : Money.zero()
      : Money.zero();
    const uncappedDiscount = coupon
      ? coupon.type === 'PERCENTAGE'
        ? subtotal.percentage(coupon.value)
        : Money.fromDecimal(coupon.value)
      : Money.zero();
    const discount = coupon
      ? uncappedDiscount.compare(coupon.maximumDiscount) > 0
        ? coupon.maximumDiscount
        : uncappedDiscount
      : Money.zero();
    const paymentFee = paymentMethodFee(paymentMethod);
    const calculated = subtotal
      .plus(vat)
      .plus(shipping)
      .plus(paymentFee)
      .minus(discount);
    return {
      subtotal,
      vat,
      shipping,
      paymentFee,
      discount,
      total: calculated.baisa < 0 ? Money.zero() : calculated,
      freeShippingRemaining,
    };
  }
}

export class ApplyCouponUseCase {
  constructor(private readonly repository: CouponRepository) {}

  async execute(code: string, cart: Cart): Promise<Result<Coupon, AppError>> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return err(invalidCoupon('Enter a coupon code.'));
    const result = await this.repository.validate(normalized);
    if (!result.ok) return result;
    if (cartSubtotal(cart).compare(result.value.minimumOrder) < 0) {
      return err(
        invalidCoupon('The minimum order value has not been reached.'),
      );
    }
    if (Date.parse(result.value.expiresAt) <= Date.now()) {
      return err(invalidCoupon('Coupon has expired.'));
    }
    return ok(result.value);
  }
}
