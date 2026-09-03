import { buildProduct } from '@test/builders';
import { fireEvent, renderWithProviders, screen } from '@test/render';

import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders complete card metadata and fires all interactions', async () => {
    const onOpen = jest.fn();
    const onPrefetch = jest.fn();
    const onWishlist = jest.fn();
    const onAdd = jest.fn();
    const product = buildProduct();
    await renderWithProviders(
      <ProductCard
        product={product}
        express
        showRating
        onOpen={onOpen}
        onPrefetch={onPrefetch}
        onWishlist={onWishlist}
        onAdd={onAdd}
      />,
    );

    expect(screen.getByText(product.title)).toBeOnTheScreen();
    expect(screen.getByText('19.900')).toBeOnTheScreen();
    expect(screen.getByText('25.000')).toBeOnTheScreen();
    expect(screen.getByText('-20%')).toBeOnTheScreen();
    expect(screen.getByText('4.8 (42)')).toBeOnTheScreen();
    expect(screen.getByText('Hub Express')).toBeOnTheScreen();

    await fireEvent(screen.getByLabelText(product.title), 'pressIn');
    await fireEvent.press(screen.getByLabelText(product.title));
    await fireEvent.press(screen.getByLabelText('المفضلة'));
    await fireEvent.press(screen.getByLabelText('أضف للعربة'));
    expect(onPrefetch).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onWishlist).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('omits the rating, as every catalogue card in the prototype does', async () => {
    const product = buildProduct();
    await renderWithProviders(
      <ProductCard product={product} onOpen={jest.fn()} />,
    );

    expect(screen.getByText(product.title)).toBeOnTheScreen();
    expect(screen.queryByText('4.8 (42)')).toBeNull();
  });
});
