import { render, screen } from '@test/render';

import { EmptyState, ErrorState } from './States';

describe('feedback state views', () => {
  it.each([EmptyState, ErrorState])(
    'renders title, body and action',
    async (StateView) => {
      await render(
        <StateView title="State title" body="State body" actionLabel="Act" />,
      );
      expect(screen.getByText('State title')).toBeOnTheScreen();
      expect(screen.getByText('State body')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Act' })).toBeOnTheScreen();
    },
  );
});
