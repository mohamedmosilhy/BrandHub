import { Money } from '@core/money';
import { ok } from '@core/result';

import {
  GetProductDetailUseCase,
  GetRelatedProductsUseCase,
  type Product,
  type ProductRepository,
  type ReviewRepository,
  type SellerRepository,
} from '@domain/catalog';

import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { ProductScreen } from './ProductScreen';

jest.mock('@shopify/flash-list', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});

const review = {
  id: 'review-1',
  productId: 'product-1',
  authorName: 'Salim Al Rashdi',
  rating: 5,
  comment: 'منتج ممتاز ووصل بسرعة.',
  createdAt: '2026-09-02T12:00:00.000Z',
};

function fixture({
  product = buildProduct(),
  reviews = [review],
  related = [buildProduct({ id: 'product-2', title: 'منتج قريب' })],
}: {
  product?: Product;
  reviews?: (typeof review)[];
  related?: Product[];
} = {}) {
  const products = {
    getById: jest.fn(async () => ok(product)),
    getRelated: jest.fn(async () => ok(related)),
    search: jest.fn(),
    getByCategory: jest.fn(),
    getBestSellers: jest.fn(),
    getNewArrivals: jest.fn(),
    getFeatured: jest.fn(),
  } as unknown as ProductRepository;
  const reviewRepository: ReviewRepository = {
    listByProduct: jest.fn(async (_id, page, size = 10) =>
      ok({
        items: reviews,
        page,
        size,
        total: reviews.length,
        hasNext: false,
      }),
    ),
  };
  const sellerRepository: SellerRepository = {
    getById: jest.fn(async () =>
      ok({
        id: 'seller-a2',
        storeName: 'A2 Official Store',
        verified: true,
        rating: 4.8,
        salesCount: 1940,
        imageUrl: null,
      }),
    ),
    getProducts: jest.fn(),
  };
  return { product, products, reviewRepository, sellerRepository };
}

async function mount(
  overrides: Parameters<typeof fixture>[0] = {},
  handlers: Partial<{
    onOpenSeller: jest.Mock;
    onAddedToCart: jest.Mock;
    onBuyNow: jest.Mock;
  }> = {},
) {
  const { product, products, reviewRepository, sellerRepository } =
    fixture(overrides);
  const onOpenSeller = handlers.onOpenSeller ?? jest.fn();
  const onAddedToCart = handlers.onAddedToCart ?? jest.fn();
  const onBuyNow = handlers.onBuyNow ?? jest.fn();
  await renderWithProviders(
    <ProductScreen
      productId={product.id}
      getProductDetail={new GetProductDetailUseCase(products)}
      getRelatedProducts={new GetRelatedProductsUseCase(products)}
      reviewRepository={reviewRepository}
      sellerRepository={sellerRepository}
      onBack={jest.fn()}
      onCart={jest.fn()}
      onOpenProduct={jest.fn()}
      onOpenSeller={onOpenSeller}
      onAddedToCart={onAddedToCart}
      onBuyNow={onBuyNow}
    />,
  );
  return { product, onOpenSeller, onAddedToCart, onBuyNow };
}

/**
 * Four renders, deliberately. `@testing-library/react-native` v14's renderer stops mounting
 * after the fourth `render()` in one file in this environment — a fifth produces a null tree —
 * so the page-level assertions are grouped rather than split one per `it`.
 */
describe('ProductScreen', () => {
  it('renders the whole page for a full product (AC7.1–7.3, AC7.8, AC7.10, AC7.14)', async () => {
    const { product, onOpenSeller } = await mount({
      related: [
        buildProduct({ id: 'product-1', title: 'نفس المنتج' }),
        buildProduct({ id: 'product-9', title: 'منتج آخر' }),
      ],
    });

    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
    // Discount derived from 25.000 → 19.900 (BR11), with the strikethrough beside it.
    // The prototype writes the discount as a word in Arabic, a minus sign in English.
    expect(screen.getByText('خصم 20%')).toBeOnTheScreen();
    expect(screen.getAllByText('19.900').length).toBeGreaterThan(0);
    expect(screen.getAllByText('25.000').length).toBeGreaterThan(0);
    expect(screen.getByText('المواصفات')).toBeOnTheScreen();
    await waitFor(
      () => expect(screen.getByText('A2 Official Store')).toBeOnTheScreen(),
      { timeout: 4000 },
    );
    await waitFor(
      () => expect(screen.getByText('Salim Al Rashdi')).toBeOnTheScreen(),
      { timeout: 4000 },
    );
    expect(screen.getByText(review.comment)).toBeOnTheScreen();

    // AC7.10: the rail offers the sibling, never the product already on screen.
    expect(screen.getByText('قد يعجبك أيضاً')).toBeOnTheScreen();
    expect(screen.queryByText('نفس المنتج')).toBeNull();
    expect(screen.getByText('منتج آخر')).toBeOnTheScreen();

    // AC7.8: the seller strip is the way into that seller's store.
    fireEvent.press(screen.getByText('زيارة المتجر'));
    expect(onOpenSeller).toHaveBeenCalledWith('seller-a2');
  });

  it('degrades for a product with no old price, discount or reviews (AC7.4, AC7.14)', async () => {
    const { product } = await mount({
      product: buildProduct({
        originalPrice: null,
        price: Money.fromDecimal('12.000'),
      }),
      reviews: [],
      related: [],
    });

    await waitFor(() =>
      expect(screen.getByText(product.title)).toBeOnTheScreen(),
    );
    expect(screen.queryByText('خصم 20%')).toBeNull();
    expect(screen.queryByText('25.000')).toBeNull();
    await waitFor(
      () =>
        expect(
          screen.getByText('لا توجد تقييمات لهذا المنتج بعد'),
        ).toBeOnTheScreen(),
      { timeout: 4000 },
    );
  });

  it('blocks the buy bar until a multi-variant product is chosen from (AC7.5)', async () => {
    const product = buildProduct({
      variants: [
        {
          id: 'variant-black',
          sku: 'BH-1-D',
          attributes: { colour: 'Black' },
          stock: 4,
          price: Money.fromDecimal('19.900'),
        },
        {
          id: 'variant-sand',
          sku: 'BH-1-S',
          attributes: { colour: 'Sand' },
          stock: 3,
          price: Money.fromDecimal('21.000'),
        },
      ],
    });
    const { onAddedToCart } = await mount({ product, related: [] });

    await waitFor(() =>
      expect(
        screen.getByText('اختر اللون قبل الإضافة إلى العربة'),
      ).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('أضف للعربة'));
    expect(onAddedToCart).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Sand'));

    await waitFor(() =>
      expect(
        screen.queryByText('اختر اللون قبل الإضافة إلى العربة'),
      ).toBeNull(),
    );
    // The chosen variant's own price replaces the product's in the price row.
    expect(screen.getByText('21.000')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('أضف للعربة'));
    expect(onAddedToCart).toHaveBeenCalledTimes(1);
  });

  it('hides the selector and sells in one tap for a single variant (AC7.5b, AC7.12)', async () => {
    const { onAddedToCart, onBuyNow } = await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('أضف للعربة')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('اللون')).toBeNull();

    fireEvent.press(screen.getByLabelText('أضف للعربة'));
    expect(onAddedToCart).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText('اشترِ الآن'));
    expect(onBuyNow).toHaveBeenCalledTimes(1);
  });
});
