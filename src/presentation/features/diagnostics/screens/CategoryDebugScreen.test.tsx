import { ok } from '@core/result';

import type { CategoryRepository } from '@domain/catalog';

import { renderWithProviders, screen, waitFor } from '@test/render';

import { CategoryDebugScreen } from './CategoryDebugScreen';

describe('CategoryDebugScreen', () => {
  it('lists categories delivered through the domain repository', async () => {
    const repository: CategoryRepository = {
      getTree: jest.fn(async () =>
        ok([
          {
            id: 'electronics',
            title: 'الإلكترونيات',
            slug: 'electronics',
            imageUrl: '/category.png',
            children: [
              {
                id: 'audio',
                title: 'الصوتيات',
                slug: 'audio',
                imageUrl: '/audio.png',
                children: [],
              },
            ],
          },
        ]),
      ),
    };
    await renderWithProviders(<CategoryDebugScreen repository={repository} />);

    await waitFor(() => {
      expect(screen.getByText('الإلكترونيات')).toBeOnTheScreen();
      expect(screen.getByText('الصوتيات')).toBeOnTheScreen();
    });
    expect(repository.getTree).toHaveBeenCalledTimes(1);
  });
});
