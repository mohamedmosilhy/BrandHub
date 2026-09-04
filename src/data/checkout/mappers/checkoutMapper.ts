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

/**
 * The contained workaround for the missing address-to-area link (architecture.md §34.4). Nothing
 * in the collection joins an address to the area that carries its delivery price, so the city is
 * matched against the area's own name and then its governorate. The address form's city select is
 * driven by `/areas`, so a city the app itself saved always matches by name; the governorate arm
 * covers records seeded or created elsewhere.
 *
 * An explicit `areaId` from the server always wins, so the day the backend adds one this function
 * degrades to returning it and can then be deleted. It is the single edit that replacement needs.
 */
export function resolveAddressArea(
  address: { city: string; areaId?: string | undefined },
  areas: readonly ShippingAreaDto[] = [],
): string | null {
  if (address.areaId) return address.areaId;
  const city = address.city.trim().toLocaleLowerCase();
  const matches = (value: string) => value.trim().toLocaleLowerCase() === city;
  // Name before governorate, across the whole list: "Muscat" is both an area and the governorate
  // of Seeb, and scanning field-by-field per area would hand Muscat's addresses to Seeb's price.
  const byName = areas.find((area) => matches(area.name));
  const byGovernorate = areas.find((area) => matches(area.governorate));
  return (byName ?? byGovernorate)?.id ?? null;
}

export function mapShippingAddress(
  dto: ShippingAddressDto,
  areas: readonly ShippingAreaDto[] = [],
): ShippingAddress {
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
    areaId: resolveAddressArea(dto, areas),
    isDefault: dto.isDefault,
  };
}
