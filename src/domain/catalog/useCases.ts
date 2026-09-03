import type { AppError } from '@core/errors';
import { err, ok, type Result } from '@core/result';

import {
  resolveVariant,
  requiresVariantChoice,
  type Category,
  type Product,
  type ProductVariant,
} from '@domain/catalog/entities';
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

export type ProductDetail = Readonly<{
  product: Product;
  /** Resolved without a choice when the product has exactly one variant (D8). */
  variant: ProductVariant | null;
  requiresVariantChoice: boolean;
}>;

/**
 * Fetching the product is a repository call; deciding whether a variant still has to be chosen
 * is D8's rule, and that is what earns this use case its place. Reviews and related products are
 * separate queries so one slow section cannot hold up the rest of the page.
 */
export class GetProductDetailUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(
    id: string,
    selectedVariantId: string | null = null,
  ): Promise<Result<ProductDetail, AppError>> {
    const result = await this.products.getById(id);
    if (!result.ok) return result;
    const product = result.value;
    return ok({
      product,
      variant: resolveVariant(product, selectedVariantId),
      requiresVariantChoice: requiresVariantChoice(product),
    });
  }
}

/** AC7.10: the rail never offers the product the buyer is already looking at. */
export class GetRelatedProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string): Promise<Result<readonly Product[], AppError>> {
    const result = await this.products.getRelated(id);
    if (!result.ok) return result;
    return ok(result.value.filter((product) => product.id !== id));
  }
}
