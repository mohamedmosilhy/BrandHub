import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { AccountMetricsRepository } from '@domain/identity';

import type { AccountRemoteDataSource } from '@data/identity/datasources';

import { normalizeHttpError } from '@infrastructure/http';

export class HttpAccountMetricsRepository implements AccountMetricsRepository {
  constructor(private readonly remote: AccountRemoteDataSource) {}

  async get() {
    try {
      return ok(await this.remote.get());
    } catch (error) {
      return err(isAppError(error) ? error : normalizeHttpError(error));
    }
  }
}
