import { DomainError, type AppError } from '@core/errors';
import { err, ok, type Result } from '@core/result';

import { createPhoneNumber } from '@domain/identity';

import type { AddressRepository } from './AddressRepository';
import type { Address, AddressDraft, AddressInput, City } from './entities';

function invalid(code: string, message: string): DomainError {
  return new DomainError({ code, message, correlationId: 'domain-addresses' });
}

export function createCity(value: string): Result<City, DomainError> {
  const city = value.trim();
  return city
    ? ok(city as City)
    : err(invalid('CITY_REQUIRED', 'Choose a city'));
}

/**
 * Validates the form's draft and turns it into the port's input.
 *
 * The Omani phone rule is `@domain/identity`'s, not a second copy of the same regex: a recipient's
 * number and an account's number are the same value, and having one rule means a change to the
 * national format is a single edit.
 */
function validate(
  draft: AddressDraft,
  isDefault: boolean,
): Result<AddressInput, DomainError> {
  if (!draft.recipientName.trim())
    return err(invalid('NAME_REQUIRED', 'Enter the recipient name'));
  if (!draft.details.trim())
    return err(invalid('DETAILS_REQUIRED', 'Enter the address details'));
  const phone = createPhoneNumber(draft.phone);
  if (!phone.ok) return phone;
  const city = createCity(draft.city);
  if (!city.ok) return city;
  return ok({
    label: draft.label,
    recipientName: draft.recipientName.trim(),
    phone: phone.value,
    details: draft.details.trim(),
    city: city.value,
    isDefault,
  });
}

export class SaveAddressUseCase {
  constructor(private readonly repository: AddressRepository) {}

  /**
   * `id` absent means create. BR7 says exactly one address is the default, so the first address an
   * account saves becomes it — otherwise a new account would have addresses and no default, and
   * checkout would have nothing to preselect.
   */
  async execute(
    id: string | undefined,
    draft: AddressDraft,
  ): Promise<Result<Address, AppError>> {
    if (id) {
      const existing = await this.repository.getById(id);
      if (!existing.ok) return existing;
      const input = validate(draft, existing.value.isDefault);
      return input.ok ? this.repository.update(id, input.value) : input;
    }
    const current = await this.repository.list();
    if (!current.ok) return current;
    const input = validate(draft, current.value.length === 0);
    return input.ok ? this.repository.create(input.value) : input;
  }
}

export class SetDefaultAddressUseCase {
  constructor(private readonly repository: AddressRepository) {}

  /**
   * Returns the whole list rather than the one address, because BR7 is a statement about the list:
   * exactly one entry is the default. Enforcing it here as well as server-side means the screen
   * can never render two default badges while a refetch is in flight.
   */
  async execute(id: string): Promise<Result<readonly Address[], AppError>> {
    const applied = await this.repository.setDefault(id);
    if (!applied.ok) return applied;
    const list = await this.repository.list();
    if (!list.ok) return list;
    return ok(
      list.value.map((address) => ({
        ...address,
        isDefault: address.id === id,
      })),
    );
  }
}

export class DeleteAddressUseCase {
  constructor(private readonly repository: AddressRepository) {}
  execute(id: string): Promise<Result<void, AppError>> {
    return this.repository.delete(id);
  }
}
