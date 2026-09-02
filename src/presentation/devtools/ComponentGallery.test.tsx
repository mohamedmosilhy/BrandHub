import { fireEvent, render, screen, waitFor } from '@test/render';

import { ComponentGallery } from './ComponentGallery';

describe('ComponentGallery', () => {
  it('renders every documented component family and state controls', async () => {
    await render(<ComponentGallery />);
    expect(screen.getByText('العناصر الأساسية')).toBeOnTheScreen();
    expect(screen.getByText('عناصر التحكّم')).toBeOnTheScreen();
    expect(screen.getByText('الأسطح')).toBeOnTheScreen();
    expect(screen.getByText('الحالات والتنبيهات')).toBeOnTheScreen();
    expect(screen.getByText('التخطيط')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'جارٍ الحفظ' })).toBeDisabled();
    expect(screen.getAllByRole('switch').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  it('previews RTL immediately and switches all gallery copy to English', async () => {
    await render(<ComponentGallery />);
    fireEvent.press(screen.getByRole('radio', { name: 'من اليمين لليسار' }));
    await waitFor(() => {
      expect(screen.getByTestId('screen-header-back-icon')).toHaveStyle({
        transform: [{ scaleX: -1 }],
      });
    });

    fireEvent.press(screen.getByRole('radio', { name: 'الإنجليزية' }));
    expect(await screen.findByText('Primitives')).toBeOnTheScreen();
  });
});
