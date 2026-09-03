import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { ReviewRepository } from '@domain/catalog';

import type { ReviewRemoteDataSource } from '@data/catalog/datasources';
import { mapReviewPage } from '@data/catalog/mappers';

import { normalizeHttpError } from '@infrastructure/http';

export class HttpReviewRepository implements ReviewRepository {
  constructor(private readonly remote: ReviewRemoteDataSource) {}

  async listByProduct(productId: string, page: number, size = 10) {
    try {
      return ok(
        mapReviewPage(await this.remote.listByProduct(productId, page, size)),
      );
    } catch (error) {
      return err(isAppError(error) ? error : normalizeHttpError(error));
    }
  }
}
