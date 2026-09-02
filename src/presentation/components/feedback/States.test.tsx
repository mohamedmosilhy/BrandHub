import { Text } from '@presentation/components/primitives';

import { render, screen } from '@test/render';

import { AsyncBoundary } from './States';

const slots = {
  loading: <Text>loading-slot</Text>,
  empty: <Text>empty-slot</Text>,
  error: <Text>error-slot</Text>,
};

describe('AsyncBoundary', () => {
  it.each([
    ['pending', false, 'loading-slot'],
    ['error', false, 'error-slot'],
    ['success', true, 'empty-slot'],
    ['success', false, 'content-slot'],
  ] as const)('renders only %s/%s state', async (status, isEmpty, expected) => {
    await render(
      <AsyncBoundary {...slots} status={status} isEmpty={isEmpty}>
        <Text>content-slot</Text>
      </AsyncBoundary>,
    );
    expect(screen.getByText(expected)).toBeOnTheScreen();
    expect(screen.queryAllByText(/-slot$/)).toHaveLength(1);
  });
});
