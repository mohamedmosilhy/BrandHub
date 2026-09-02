import { fireEvent, render, screen } from '@test/render';

import { Button } from './Button';

describe('Button', () => {
  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'renders the %s variant accessibly',
    async (variant) => {
      await render(<Button label={variant} variant={variant} />);
      expect(screen.getByRole('button', { name: variant })).toBeOnTheScreen();
    },
  );

  it('fires once when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps its label for width and disables while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Save')).toBeOnTheScreen();
    expect(screen.getByTestId('button-spinner')).toBeOnTheScreen();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
