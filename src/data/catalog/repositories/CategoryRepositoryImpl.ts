import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { CategoryRepository } from '@domain/catalog';

import { CategoryRemoteDataSource } from '@data/catalog/datasources';
import { mapCategoryTree } from '@data/catalog/mappers';

import { normalizeHttpError } from '@infrastructure/http';

export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private readonly remote: CategoryRemoteDataSource) {}

  async getTree(): ReturnType<CategoryRepository['getTree']> {
    try {
      return ok(mapCategoryTree(await this.remote.getTree()));
    } catch (error) {
      return err(isAppError(error) ? error : normalizeHttpError(error));
    }
  }
}
