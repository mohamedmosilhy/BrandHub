import { ok } from '@core/result';

import type { AddressRepository } from './AddressRepository';
import type { Address, AddressInput, City } from './entities';
import {
  DeleteAddressUseCase,
  SaveAddressUseCase,
  SetDefaultAddressUseCase,
} from './useCases';

function buildAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 'address-1',
    label: 'HOME',
    recipientName: 'Salim Al Rashdi',
    phone: '+96899112233',
    details: 'Building 24, Flat 3',
    city: 'Seeb' as City,
    country: 'OM',
    areaId: 'area-seeb',
    isDefault: false,
    ...overrides,
  };
}

const draft = {
  label: 'HOME' as const,
  recipientName: 'Salim Al Rashdi',
  phone: '+968 9911 2233',
  details: 'Building 24, Flat 3',
  city: 'Seeb',
};

/** Stateful enough for BR7: `setDefault` writes, `list` reads back what was written. */
function repository(initial: Address[]) {
  let addresses = [...initial];
  const created: AddressInput[] = [];
  const updated: [string, AddressInput][] = [];
  return {
    created,
    updated,
    port: {
      list: jest.fn(async () => ok(addresses as readonly Address[])),
      getById: jest.fn(async (id: string) =>
        ok(addresses.find((address) => address.id === id) as Address),
      ),
      create: jest.fn(async (input: AddressInput) => {
        created.push(input);
        const address = buildAddress({
          id: `address-${addresses.length + 1}`,
          isDefault: input.isDefault,
        });
        addresses = [...addresses, address];
        return ok(address);
      }),
      update: jest.fn(async (id: string, input: AddressInput) => {
        updated.push([id, input]);
        return ok(buildAddress({ id, isDefault: input.isDefault }));
      }),
      setDefault: jest.fn(async (id: string) => {
        // Deliberately sloppy: the fake sets the new default without clearing the old one, so the
        // assertion below is about the use case's guarantee and not the fake's.
        addresses = addresses.map((address) =>
          address.id === id ? { ...address, isDefault: true } : address,
        );
        return ok(undefined);
      }),
      delete: jest.fn(async (id: string) => {
        addresses = addresses.filter((address) => address.id !== id);
        return ok(undefined);
      }),
    } satisfies AddressRepository,
  };
}

describe('SaveAddressUseCase', () => {
  it('rejects a phone that is not an Omani number and never reaches the repository', async () => {
    const fake = repository([]);
    const result = await new SaveAddressUseCase(fake.port).execute(undefined, {
      ...draft,
      phone: '+971501234567',
    });

    expect(result.ok).toBe(false);
    expect(result.ok || result.error.code).toBe('INVALID_PHONE');
    expect(fake.port.create).not.toHaveBeenCalled();
  });

  it.each([
    ['recipientName', 'NAME_REQUIRED'],
    ['details', 'DETAILS_REQUIRED'],
    ['city', 'CITY_REQUIRED'],
  ])('rejects a blank %s', async (field, code) => {
    const fake = repository([]);
    const result = await new SaveAddressUseCase(fake.port).execute(undefined, {
      ...draft,
      [field]: '   ',
    });

    expect(result.ok || result.error.code).toBe(code);
  });

  it('makes the account’s first address the default, and later ones not (BR7)', async () => {
    const fake = repository([]);
    const useCase = new SaveAddressUseCase(fake.port);

    await useCase.execute(undefined, draft);
    await useCase.execute(undefined, draft);

    expect(fake.created.map((input) => input.isDefault)).toEqual([true, false]);
  });

  it('normalises the phone and trims the text before it reaches the port', async () => {
    const fake = repository([]);

    await new SaveAddressUseCase(fake.port).execute(undefined, {
      ...draft,
      recipientName: '  Salim Al Rashdi  ',
      details: '  Building 24, Flat 3  ',
    });

    expect(fake.created[0]).toMatchObject({
      phone: '+96899112233',
      recipientName: 'Salim Al Rashdi',
      details: 'Building 24, Flat 3',
      city: 'Seeb',
    });
  });

  it('updates the existing record rather than creating a second one (AC9.15)', async () => {
    const fake = repository([buildAddress({ isDefault: true })]);

    const result = await new SaveAddressUseCase(fake.port).execute(
      'address-1',
      draft,
    );

    expect(result.ok).toBe(true);
    expect(fake.port.create).not.toHaveBeenCalled();
    expect(fake.updated).toHaveLength(1);
    expect(fake.updated[0]?.[0]).toBe('address-1');
    // An edit must not silently demote the address the customer had set as default.
    expect(fake.updated[0]?.[1].isDefault).toBe(true);
  });
});

describe('SetDefaultAddressUseCase', () => {
  it('leaves exactly one default, clearing the previous one (BR7, AC9.13)', async () => {
    const fake = repository([
      buildAddress({ id: 'address-1', isDefault: true }),
      buildAddress({ id: 'address-2' }),
    ]);

    const result = await new SetDefaultAddressUseCase(fake.port).execute(
      'address-2',
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filter((address) => address.isDefault)).toHaveLength(1);
    expect(result.value.find((address) => address.isDefault)?.id).toBe(
      'address-2',
    );
  });
});

describe('DeleteAddressUseCase', () => {
  it('removes the address through the port', async () => {
    const fake = repository([buildAddress()]);

    expect(
      (await new DeleteAddressUseCase(fake.port).execute('address-1')).ok,
    ).toBe(true);
    expect(fake.port.delete).toHaveBeenCalledWith('address-1');
  });
});
