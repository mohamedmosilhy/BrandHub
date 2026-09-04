import type { PhoneNumber } from '@domain/identity';

/**
 * The three labels the prototype's address card shows as its heading. The API has no field for
 * them, so the mapper carries them in `addressLine2` (D13; see `data/addresses`).
 */
export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

/**
 * A city is the name of a shipping area. Until the backend links an address to an area by
 * contract, that name is the only thing the resolution has to work with (architecture.md §34.4),
 * so it is a value object rather than a bare string.
 */
export type City = string & { readonly __brand: 'City' };

export type Address = Readonly<{
  id: string;
  label: AddressLabel;
  recipientName: string;
  phone: string;
  details: string;
  city: City;
  /** Oman only in v1 (D13). `state` and `postalCode` are the API's, and the UI never collects them. */
  country: 'OM';
  /** `null` when no shipping area matches the city — checkout then falls back to its own area. */
  areaId: string | null;
  isDefault: boolean;
}>;

/** Exactly what the address form collects, before validation. */
export type AddressDraft = Readonly<{
  label: AddressLabel;
  recipientName: string;
  phone: string;
  details: string;
  city: string;
}>;

/** A validated draft. Only `SaveAddressUseCase` produces one, and only the port consumes it. */
export type AddressInput = Readonly<{
  label: AddressLabel;
  recipientName: string;
  phone: PhoneNumber;
  details: string;
  city: City;
  isDefault: boolean;
}>;
