import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Address, AddressInput } from './entities';

export interface AddressRepository {
  list(): Promise<Result<readonly Address[], AppError>>;
  getById(id: string): Promise<Result<Address, AppError>>;
  create(input: AddressInput): Promise<Result<Address, AppError>>;
  update(id: string, input: AddressInput): Promise<Result<Address, AppError>>;
  setDefault(id: string): Promise<Result<void, AppError>>;
  delete(id: string): Promise<Result<void, AppError>>;
}
