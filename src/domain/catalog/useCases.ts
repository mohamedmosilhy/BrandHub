import type { AppError } from '@core/errors';
import { err, ok, type Result } from '@core/result';

import type { Category, Product } from '@domain/catalog/entities';
import type {
  CategoryRepository,
  ProductRepository,
} from '@domain/catalog/repositories';
import {
  normalizeSearchCriteria,
  type SearchCriteria,
} from '@domain/catalog/SearchCriteria';

export class SearchProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(criteria: SearchCriteria, page = 0, size = 20) {
    return this.products.search(normalizeSearchCriteria(criteria), page, size);
  }
}

export class GetCategoryProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(categoryId: string, criteria: SearchCriteria, page = 0, size = 20) {
    return this.products.getByCategory(
      categoryId,
      page,
      normalizeSearchCriteria(criteria),
      size,
    );
  }
}

export type HomeSections = Readonly<{
  categories: readonly Category[];
  deals: readonly Product[];
}>;

export class GetHomeSectionsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(): Promise<Result<HomeSections, AppError>> {
    const [categories, deals] = await Promise.all([
      this.categories.getTree(),
      this.products.getFeatured(),
    ]);
    if (!categories.ok) return err(categories.error);
    if (!deals.ok) return err(deals.error);
    return ok({ categories: categories.value, deals: deals.value });
  }
}
