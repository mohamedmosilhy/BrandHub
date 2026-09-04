import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { AddressInput, AddressRepository } from '@domain/addresses';

import { normalizeHttpError } from '@infrastructure/http';

import type { AddressRemoteDataSource } from '../datasources';
import { mapAddress } from '../mappers';

export class HttpAddressRepository implements AddressRepository {
  constructor(private readonly remote: AddressRemoteDataSource) {}

  async list() {
    try {
      const [addresses, areas] = await Promise.all([
        this.remote.list(),
        this.remote.listAreas(),
      ]);
      return ok(addresses.map((address) => mapAddress(address, areas)));
    } catch (error) {
      return this.failure(error);
    }
  }

  async getById(id: string) {
    try {
      const [address, areas] = await Promise.all([
        this.remote.get(id),
        this.remote.listAreas(),
      ]);
      return ok(mapAddress(address, areas));
    } catch (error) {
      return this.failure(error);
    }
  }

  async create(input: AddressInput) {
    try {
      const [address, areas] = await Promise.all([
        this.remote.create(input),
        this.remote.listAreas(),
      ]);
      return ok(mapAddress(address, areas));
    } catch (error) {
      return this.failure(error);
    }
  }

  async update(id: string, input: AddressInput) {
    try {
      const [address, areas] = await Promise.all([
        this.remote.update(id, input),
        this.remote.listAreas(),
      ]);
      return ok(mapAddress(address, areas));
    } catch (error) {
      return this.failure(error);
    }
  }

  async setDefault(id: string) {
    try {
      await this.remote.setDefault(id);
      return ok(undefined);
    } catch (error) {
      return this.failure(error);
    }
  }

  async delete(id: string) {
    try {
      await this.remote.delete(id);
      return ok(undefined);
    } catch (error) {
      return this.failure(error);
    }
  }

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }
}
