import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { CategoryRepository } from '@domain/catalog';

import { CategoryRemoteDataSource } from '@data/catalog/datasources';
import {
  mapCategory,
  mapCategoryTree,
  type AssetUrlResolver,
} from '@data/catalog/mappers';

import { normalizeHttpError } from '@infrastructure/http';

export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(
    private readonly remote: CategoryRemoteDataSource,
    private readonly resolveUrl?: AssetUrlResolver,
  ) {}

  async getTree(): ReturnType<CategoryRepository['getTree']> {
    try {
      const resolveCategory = (
        category: ReturnType<typeof mapCategory>,
      ): ReturnType<typeof mapCategory> => ({
        ...category,
        imageUrl: this.resolveUrl?.(category.imageUrl) ?? category.imageUrl,
        children: category.children.map(resolveCategory),
      });
      return ok(
        mapCategoryTree(await this.remote.getTree()).map(resolveCategory),
      );
    } catch (error) {
      return err(isAppError(error) ? error : normalizeHttpError(error));
    }
  }

  async getById(id: string): ReturnType<CategoryRepository['getById']> {
    try {
      const category = mapCategory(await this.remote.getById(id));
      return ok({
        ...category,
        imageUrl: this.resolveUrl?.(category.imageUrl) ?? category.imageUrl,
      });
    } catch (error) {
      return err(isAppError(error) ? error : normalizeHttpError(error));
    }
  }
}
