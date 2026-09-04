import type { AddressInput, City } from '@domain/addresses';
import type { PhoneNumber } from '@domain/identity';

import type { ShippingAreaDto } from '@data/checkout/dto';

import type { AddressDto } from '../dto';

import { addressPayload, mapAddress } from './addressMapper';

const areas: readonly ShippingAreaDto[] = [
  {
    id: 'area-seeb',
    name: 'Seeb',
    governorate: 'Muscat',
    shippingPrice: 2,
    minOrderAmount: 25,
    estimatedDeliveryDays: 2,
    active: true,
  },
  {
    id: 'area-muscat',
    name: 'Muscat',
    governorate: 'Muscat',
    shippingPrice: 1.5,
    minOrderAmount: 20,
    estimatedDeliveryDays: 1,
    active: true,
  },
];

function dto(overrides: Partial<AddressDto> = {}): AddressDto {
  return {
    id: 'address-1',
    userId: 'user-customer',
    fullName: 'Salim Al Rashdi',
    phone: '+96899112233',
    addressLine1: 'Building 24, Flat 3',
    addressLine2: 'brandhub-label:WORK',
    city: 'Seeb',
    state: 'Muscat',
    postalCode: '121',
    country: 'OM',
    isDefault: true,
    ...overrides,
  };
}

const input: AddressInput = {
  label: 'WORK',
  recipientName: 'Salim Al Rashdi',
  phone: '+96899112233' as PhoneNumber,
  details: 'Building 24, Flat 3',
  city: 'Seeb' as City,
  isDefault: true,
};

describe('mapAddress', () => {
  it('maps every field the UI shows (D13)', () => {
    expect(mapAddress(dto(), areas)).toEqual({
      id: 'address-1',
      label: 'WORK',
      recipientName: 'Salim Al Rashdi',
      phone: '+96899112233',
      details: 'Building 24, Flat 3',
      city: 'Seeb',
      country: 'OM',
      areaId: 'area-seeb',
      isDefault: true,
    });
  });

  it('falls back to HOME when no label marker is stored', () => {
    expect(mapAddress(dto({ addressLine2: null }), areas).label).toBe('HOME');
  });

  it('keeps a seeded second address line as part of the details, not as a label', () => {
    const address = mapAddress(dto({ addressLine2: 'Al Khoudh 7' }), areas);

    expect(address.label).toBe('HOME');
    expect(address.details).toBe('Building 24, Flat 3، Al Khoudh 7');
  });

  it('resolves the shipping area by governorate when no area is named for the city', () => {
    // "Muscat" is a governorate for Seeb; a city with no area of its own still resolves.
    expect(mapAddress(dto({ city: 'Muscat' }), areas).areaId).toBe(
      'area-muscat',
    );
  });

  it('leaves the area null rather than guessing when nothing matches', () => {
    expect(mapAddress(dto({ city: 'Ibri' }), areas).areaId).toBeNull();
  });
});

describe('addressPayload', () => {
  it('sends Oman with state and postal code omitted (AC9.21)', () => {
    const payload = addressPayload(input);

    expect(payload).toEqual({
      fullName: 'Salim Al Rashdi',
      phone: '+96899112233',
      addressLine1: 'Building 24, Flat 3',
      addressLine2: 'brandhub-label:WORK',
      city: 'Seeb',
      country: 'OM',
      isDefault: true,
    });
    expect(payload).not.toHaveProperty('state');
    expect(payload).not.toHaveProperty('postalCode');
  });

  it('round-trips label, name, phone, details and city through the API shape (AC9.21)', () => {
    const stored = dto({ ...addressPayload(input), id: 'address-9' });

    expect(mapAddress(stored, areas)).toMatchObject({
      label: input.label,
      recipientName: input.recipientName,
      phone: input.phone,
      details: input.details,
      city: input.city,
    });
  });
});
