import { Button } from '@presentation/components/controls';

import { act, fireEvent, render, screen } from '@test/render';

import { useToast } from './Toast';

function ToastHarness() {
  const { showToast } = useToast();
  return (
    <Button
      label="Notify"
      onPress={() => showToast({ message: 'Saved', tone: 'success' })}
    />
  );
}

describe('Toast', () => {
  it('appears and auto-dismisses', async () => {
    jest.useFakeTimers();
    await render(<ToastHarness />);
    await act(() => {
      fireEvent.press(screen.getByRole('button', { name: 'Notify' }));
    });
    expect(
      await screen.findByRole('alert', { name: 'Saved' }),
    ).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTimeAsync(1_901));
    expect(
      screen.queryByRole('alert', { name: 'Saved' }),
    ).not.toBeOnTheScreen();
    jest.useRealTimers();
  });
});
