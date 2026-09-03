import { Money } from '@core/money';
import { ok } from '@core/result';

import {
  GetProductDetailUseCase,
  GetRelatedProductsUseCase,
  isInStock,
  requiresVariantChoice,
  resolveVariant,
  type ProductRepository,
  type ProductVariant,
} from '@domain/catalog';

import { buildProduct } from '@test/builders';

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'variant-1',
    sku: 'BH-1',
    attributes: { colour: 'Black' },
    stock: 4,
    price: Money.fromDecimal('19.900'),
    ...overrides,
  };
}

function repositoryFor(...products: ReturnType<typeof buildProduct>[]) {
  const [first] = products;
  return {
    getById: jest.fn(async () => ok(first!)),
    getRelated: jest.fn(async () => ok(products.slice(1))),
    search: jest.fn(),
    getByCategory: jest.fn(),
    getBestSellers: jest.fn(),
    getNewArrivals: jest.fn(),
    getFeatured: jest.fn(),
  } as unknown as ProductRepository;
}

describe('D8 variant resolution', () => {
  it('resolves the only variant without a choice and hides the selector', () => {
    const product = buildProduct({ variants: [variant()] });
    expect(requiresVariantChoice(product)).toBe(false);
    expect(resolveVariant(product)?.id).toBe('variant-1');
  });

  it('resolves nothing until a multi-variant product is chosen from', () => {
    const product = buildProduct({
      variants: [variant(), variant({ id: 'variant-2', sku: 'BH-2' })],
    });
    expect(requiresVariantChoice(product)).toBe(true);
    expect(resolveVariant(product)).toBeNull();
    expect(resolveVariant(product, 'variant-2')?.id).toBe('variant-2');
  });

  it('ignores a selection that is not one of the product’s variants', () => {
    const product = buildProduct({
      variants: [variant(), variant({ id: 'variant-2' })],
    });
    expect(resolveVariant(product, 'variant-from-another-product')).toBeNull();
  });

  it('reads stock from the chosen variant, falling back to the product', () => {
    const product = buildProduct({ stock: 5 });
    expect(isInStock(product)).toBe(true);
    expect(isInStock(product, variant({ stock: 0 }))).toBe(false);
    expect(isInStock(buildProduct({ stock: 0 }))).toBe(false);
  });
});

describe('GetProductDetailUseCase', () => {
  it('auto-resolves a single-variant product (AC7.5b)', async () => {
    const product = buildProduct({ variants: [variant()] });
    const useCase = new GetProductDetailUseCase(repositoryFor(product));

    const result = await useCase.execute(product.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.requiresVariantChoice).toBe(false);
    expect(result.value.variant?.id).toBe('variant-1');
  });

  it('leaves a multi-variant product unresolved until asked for one (AC7.5)', async () => {
    const product = buildProduct({
      variants: [variant(), variant({ id: 'variant-2' })],
    });
    const useCase = new GetProductDetailUseCase(repositoryFor(product));

    const unchosen = await useCase.execute(product.id);
    const chosen = await useCase.execute(product.id, 'variant-2');

    expect(unchosen.ok && unchosen.value.requiresVariantChoice).toBe(true);
    expect(unchosen.ok && unchosen.value.variant).toBeNull();
    expect(chosen.ok && chosen.value.variant?.id).toBe('variant-2');
  });
});

describe('GetRelatedProductsUseCase', () => {
  it('never offers the product the buyer is already on (AC7.10)', async () => {
    const current = buildProduct({ id: 'product-1' });
    const other = buildProduct({ id: 'product-2' });
    const repository = repositoryFor(current, current, other);
    const useCase = new GetRelatedProductsUseCase(repository);

    const result = await useCase.execute('product-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((item) => item.id)).toEqual(['product-2']);
  });
});
