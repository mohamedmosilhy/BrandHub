import type {
  Address,
  AddressInput,
  AddressLabel,
  City,
} from '@domain/addresses';

import type { ShippingAreaDto } from '@data/checkout/dto';
import { resolveAddressArea } from '@data/checkout/mappers';

import type { AddressDto } from '../dto';

/**
 * The API has no field for the prototype's address label, and D13 says nothing the UI collects may
 * be lost. `addressLine2` is the only free slot the contract offers, so the label rides there
 * behind a namespaced marker no human would type. Everything else in that field is ordinary
 * address text: it is read back as part of `details` and folded into `addressLine1` on the next
 * save, so a record seeded with a real second line round-trips its content rather than losing it.
 *
 * When the backend adds a real label field this marker and `labelOf` are the only things to
 * delete.
 */
const LABEL_MARKER = /^brandhub-label:(HOME|WORK|OTHER)$/;

function labelOf(addressLine2: string | null | undefined): AddressLabel {
  return (addressLine2?.match(LABEL_MARKER)?.[1] as AddressLabel) ?? 'HOME';
}

function detailsOf(dto: AddressDto): string {
  const second = LABEL_MARKER.test(dto.addressLine2 ?? '')
    ? null
    : dto.addressLine2?.trim();
  return [dto.addressLine1, second].filter(Boolean).join('، ');
}

export function mapAddress(
  dto: AddressDto,
  areas: readonly ShippingAreaDto[] = [],
): Address {
  return {
    id: dto.id,
    label: labelOf(dto.addressLine2),
    recipientName: dto.fullName,
    phone: dto.phone,
    details: detailsOf(dto),
    city: dto.city as City,
    country: 'OM',
    areaId: resolveAddressArea({ city: dto.city }, areas),
    isDefault: dto.isDefault,
  };
}

/**
 * `state` and `postalCode` are omitted rather than sent empty — the UI never collects them and
 * the contract marks them optional (D13). `country` is always Oman in v1.
 */
export function addressPayload(input: AddressInput) {
  return {
    fullName: input.recipientName,
    phone: input.phone,
    addressLine1: input.details,
    addressLine2: `brandhub-label:${input.label}`,
    city: input.city,
    country: 'OM' as const,
    isDefault: input.isDefault,
  };
}
