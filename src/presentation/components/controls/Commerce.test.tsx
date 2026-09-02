import { fireEvent, render, screen } from '@test/render';

import { QuantityStepper } from './Commerce';

describe('QuantityStepper', () => {
  it('emits remove when decrementing the final item', async () => {
    const onRemove = jest.fn();
    await render(
      <QuantityStepper
        accessibilityLabel="Quantity"
        value={1}
        onRemove={onRemove}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'تقليل الكمية' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
