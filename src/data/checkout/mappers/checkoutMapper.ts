import { Money } from '@core/money';

import type { Coupon, ShippingAddress, ShippingArea } from '@domain/checkout';

import type {
  CouponDto,
  ShippingAddressDto,
  ShippingAreaDto,
} from '@data/checkout/dto';

export function mapCoupon(dto: CouponDto): Coupon {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    type: dto.type,
    value: dto.value,
    minimumOrder: Money.fromDecimal(dto.minimumOrder),
    maximumDiscount: Money.fromDecimal(dto.maximumDiscount),
    expiresAt: dto.expiresAt,
  };
}

export function mapShippingArea(dto: ShippingAreaDto): ShippingArea {
  return {
    id: dto.id,
    name: dto.name,
    governorate: dto.governorate,
    shippingPrice: Money.fromDecimal(dto.shippingPrice),
    minOrderAmount: Money.fromDecimal(dto.minOrderAmount),
    estimatedDeliveryDays: dto.estimatedDeliveryDays,
  };
}

export function mapShippingAddress(dto: ShippingAddressDto): ShippingAddress {
  return {
    id: dto.id,
    fullName: dto.fullName,
    phone: dto.phone,
    addressLine1: dto.addressLine1,
    addressLine2: dto.addressLine2 ?? null,
    city: dto.city,
    state: dto.state ?? null,
    postalCode: dto.postalCode ?? null,
    country: dto.country,
    areaId: dto.areaId,
    isDefault: dto.isDefault,
  };
}
