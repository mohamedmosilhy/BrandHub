/** @jest-environment node */

import type { AddressInput, City } from '@domain/addresses';
import type { PhoneNumber } from '@domain/identity';

import type {
  HttpClient,
  HttpResponse,
  RequestConfig,
} from '@infrastructure/http';

import { AddressRemoteDataSource } from '../datasources';

import { HttpAddressRepository } from './HttpAddressRepository';

const areas = [
  {
    id: 'area-seeb',
    name: 'Seeb',
    governorate: 'Muscat',
    shippingPrice: 2,
    minOrderAmount: 25,
    estimatedDeliveryDays: 2,
    active: true,
  },
];

const input: AddressInput = {
  label: 'WORK',
  recipientName: 'Salim Al Rashdi',
  phone: '+96899112233' as PhoneNumber,
  details: 'Office 52, Knowledge Oasis',
  city: 'Seeb' as City,
  isDefault: false,
};

/** Stores what it is sent, so a save can be read back the way the real API would return it. */
class FakeApi implements HttpClient {
  readonly requests: RequestConfig[] = [];
  private readonly stored = new Map<string, Record<string, unknown>>();

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    this.requests.push(config);
    return {
      data: this.handle(config) as T,
      status: 200,
      headers: {},
      correlationId: 'cor-addresses',
    };
  }

  private handle(config: RequestConfig): unknown {
    if (config.endpoint === '/areas') return areas;
    if (config.endpoint === '/users/me/addresses') {
      if (config.method === 'GET') return [...this.stored.values()];
      const id = `address-${this.stored.size + 1}`;
      const record = {
        id,
        userId: 'user-customer',
        ...(config.body as Record<string, unknown>),
      };
      this.stored.set(id, record);
      return record;
    }
    const id = config.endpoint.split('/').pop() as string;
    if (config.method === 'PUT') {
      const record = {
        ...this.stored.get(id),
        ...(config.body as Record<string, unknown>),
        id,
        userId: 'user-customer',
      };
      this.stored.set(id, record);
      return record;
    }
    return this.stored.get(id);
  }
}

function fixture() {
  const http = new FakeApi();
  return {
    http,
    repository: new HttpAddressRepository(new AddressRemoteDataSource(http)),
  };
}

describe('HttpAddressRepository', () => {
  it('round-trips a saved address without losing a field (AC9.21)', async () => {
    const { repository } = fixture();

    const created = await repository.create(input);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const listed = await repository.list();

    expect(listed.ok && listed.value).toEqual([
      {
        id: created.value.id,
        label: 'WORK',
        recipientName: 'Salim Al Rashdi',
        phone: '+96899112233',
        details: 'Office 52, Knowledge Oasis',
        city: 'Seeb',
        country: 'OM',
        areaId: 'area-seeb',
        isDefault: false,
      },
    ]);
  });

  it('sends country as Oman and omits state and postal code (D13)', async () => {
    const { http, repository } = fixture();

    await repository.create(input);

    const post = http.requests.find((request) => request.method === 'POST')
      ?.body as Record<string, unknown>;
    expect(post['country']).toBe('OM');
    expect(post).not.toHaveProperty('state');
    expect(post).not.toHaveProperty('postalCode');
  });

  it('updates the existing record in place rather than appending one (AC9.15)', async () => {
    const { repository } = fixture();
    const created = await repository.create(input);
    if (!created.ok) return;

    await repository.update(created.value.id, {
      ...input,
      details: 'Office 61, Knowledge Oasis',
    });
    const listed = await repository.list();

    expect(listed.ok && listed.value).toHaveLength(1);
    expect(listed.ok && listed.value[0]?.details).toBe(
      'Office 61, Knowledge Oasis',
    );
  });

  it('calls the set-default endpoint for the address it was given', async () => {
    const { http, repository } = fixture();

    await repository.setDefault('address-2');

    expect(http.requests[0]).toMatchObject({
      method: 'POST',
      endpoint: '/users/me/addresses/address-2/set-default',
    });
  });
});
