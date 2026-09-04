import { Money } from '@core/money';
import { ok } from '@core/result';

import { Quantity, type Cart } from '@domain/cart';

import { buildProduct } from '@test/builders';

import type { Coupon, ShippingArea } from './entities';
import type { CouponRepository } from './repositories';
import { ApplyCouponUseCase, CalculateCartTotalsUseCase } from './useCases';

const product = buildProduct();
const cart: Cart = {
  id: 'cart-1',
  lines: [
    {
      id: 'line-1',
      product,
      variant: product.variants[0]!,
      quantity: Quantity.create(1),
      unitPrice: Money.fromDecimal('19.900'),
      lineTotal: Money.fromDecimal('19.900'),
    },
  ],
};
const area: ShippingArea = {
  id: 'area-1',
  name: 'Muscat',
  governorate: 'Muscat',
  shippingPrice: Money.fromDecimal('1.500'),
  minOrderAmount: Money.fromDecimal('20.000'),
  estimatedDeliveryDays: 1,
};
const coupon: Coupon = {
  id: 'coupon-1',
  code: 'WELCOME10',
  name: 'Welcome',
  type: 'PERCENTAGE',
  value: 10,
  minimumOrder: Money.fromDecimal('5.000'),
  maximumDiscount: Money.fromDecimal('25.000'),
  expiresAt: '2099-01-01T00:00:00.000Z',
};

describe('checkout totals', () => {
  it('implements BR2 and BR3 with shipping, COD fee and coupon discount', () => {
    const totals = new CalculateCartTotalsUseCase().execute(
      cart,
      area,
      'CASH_ON_DELIVERY',
      coupon,
    );
    expect(totals.subtotal.toDecimalString()).toBe('19.900');
    expect(totals.vat.toDecimalString()).toBe('0.995');
    expect(totals.shipping.toDecimalString()).toBe('1.500');
    expect(totals.paymentFee.toDecimalString()).toBe('0.500');
    expect(totals.discount.toDecimalString()).toBe('1.990');
    expect(totals.total.toDecimalString()).toBe('20.905');
    expect(totals.freeShippingRemaining.toDecimalString()).toBe('0.100');
  });

  it('makes delivery free exactly at the area threshold', () => {
    const thresholdCart: Cart = {
      ...cart,
      lines: [{ ...cart.lines[0]!, unitPrice: Money.fromDecimal('20.000') }],
    };
    const totals = new CalculateCartTotalsUseCase().execute(
      thresholdCart,
      area,
      'CREDIT_CARD',
      null,
    );
    expect(totals.shipping.baisa).toBe(0);
    expect(totals.freeShippingRemaining.baisa).toBe(0);
  });

  it('applies a valid coupon and rejects one below its minimum', async () => {
    const repository: CouponRepository = {
      validate: jest.fn(async () => ok(coupon)),
    };
    expect(
      (await new ApplyCouponUseCase(repository).execute(' welcome10 ', cart))
        .ok,
    ).toBe(true);
    const expensive = { ...coupon, minimumOrder: Money.fromDecimal('30.000') };
    repository.validate = jest.fn(async () => ok(expensive));
    expect(
      (await new ApplyCouponUseCase(repository).execute('WELCOME10', cart)).ok,
    ).toBe(false);
  });
});
