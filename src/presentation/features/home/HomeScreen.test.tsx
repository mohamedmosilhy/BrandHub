import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import type { CategoryRepository, ProductRepository } from '@domain/catalog';

import { buildProduct } from '@test/builders';
import { renderWithProviders, screen, waitFor } from '@test/render';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('keeps the deals section visible when categories fail independently', async () => {
    const product = buildProduct();
    const error = new ServerError(500, {
      code: 'SERVER_ERROR',
      message: 'failed',
      correlationId: 'cor-home',
    });
    const categories: CategoryRepository = {
      getTree: jest.fn(async () => err(error)),
      getById: jest.fn(async () => err(error)),
    };
    const products: ProductRepository = {
      search: jest.fn(async (_criteria, page, size = 20) =>
        ok({ items: [product], page, size, total: 1, hasNext: false }),
      ),
      getById: jest.fn(async () => ok(product)),
      getRelated: jest.fn(async () => ok([])),
      getByCategory: jest.fn(async (_id, page, _criteria, size = 20) =>
        ok({ items: [product], page, size, total: 1, hasNext: false }),
      ),
      getBestSellers: jest.fn(async () => ok([product])),
      getNewArrivals: jest.fn(async () => ok([product])),
      getFeatured: jest.fn(async () => ok([product])),
    };
    await renderWithProviders(
      <HomeScreen
        categoryRepository={categories}
        productRepository={products}
        onSearch={jest.fn()}
        onNotifications={jest.fn()}
        onBrowse={jest.fn()}
        onOpenCategory={jest.fn()}
        onOpenProduct={jest.fn()}
        onOpenInfluencer={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
    expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen();
  });
});
