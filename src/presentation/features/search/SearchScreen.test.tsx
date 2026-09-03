import { ok } from '@core/result';

import {
  GetProductDetailUseCase,
  SearchProductsUseCase,
  type ProductRepository,
} from '@domain/catalog';

import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { SearchScreen } from './SearchScreen';

jest.mock('@shopify/flash-list', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});

function fixture() {
  const product = buildProduct();
  const repository: ProductRepository = {
    search: jest.fn(async (criteria, page, size = 20) => {
      const matches =
        criteria.query === 'سماعات' || !criteria.query ? [product] : [];
      return ok({
        items: matches,
        page,
        size,
        total: matches.length,
        hasNext: false,
      });
    }),
    getById: jest.fn(async () => ok(product)),
    getRelated: jest.fn(async () => ok([])),
    getByCategory: jest.fn(async (_id, page, _criteria, size = 20) =>
      ok({ items: [product], page, size, total: 1, hasNext: false }),
    ),
    getBestSellers: jest.fn(async () => ok([product])),
    getNewArrivals: jest.fn(async () => ok([product])),
    getFeatured: jest.fn(async () => ok([product])),
  };
  return {
    product,
    repository,
    useCase: new SearchProductsUseCase(repository),
    getProductDetail: new GetProductDetailUseCase(repository),
  };
}

describe('SearchScreen', () => {
  it('moves from pre-query prompt to results and then the empty state', async () => {
    const { product, getProductDetail, useCase } = fixture();
    await renderWithProviders(
      <SearchScreen
        getProductDetail={getProductDetail}
        searchProducts={useCase}
        onBack={jest.fn()}
        onOpenProduct={jest.fn()}
      />,
    );
    expect(
      screen.getAllByText('ابدأ الكتابة لعرض النتائج').length,
    ).toBeGreaterThan(0);

    await fireEvent.press(screen.getByLabelText('سماعات'));
    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
    expect(screen.getByText('1 نتيجة')).toBeOnTheScreen();

    await fireEvent.changeText(
      screen.getByLabelText('عن ماذا تبحث؟'),
      'غير موجود',
    );
    await waitFor(() =>
      expect(screen.getByText('لا توجد نتائج مطابقة')).toBeOnTheScreen(),
    );
  });

  it('removes seller scope and restores unscoped results', async () => {
    const { product, getProductDetail, useCase } = fixture();
    await renderWithProviders(
      <SearchScreen
        sellerId="seller-a2"
        getProductDetail={getProductDetail}
        searchProducts={useCase}
        onBack={jest.fn()}
        onOpenProduct={jest.fn()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
    expect(screen.getByText('منتجات seller-a2')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('إزالة seller-a2'));
    await waitFor(() =>
      expect(screen.queryByText('منتجات seller-a2')).not.toBeOnTheScreen(),
    );
    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
  });
});
