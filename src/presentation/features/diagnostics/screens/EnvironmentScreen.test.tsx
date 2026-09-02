import { renderWithProviders, screen } from '@test/render';

import { EnvironmentScreen } from './EnvironmentScreen';

const rows = [
  { label: 'API base URL', value: 'http://localhost:8081/api/v1' },
  { label: 'Default locale', value: 'ar' },
] as const;

describe('EnvironmentScreen', () => {
  it('shows the environment name and every row it is given', async () => {
    await renderWithProviders(
      <EnvironmentScreen
        title="BRANDHUB · Phase 1"
        environmentName="development"
        rows={rows}
      />,
    );

    expect(screen.getByText('development')).toBeOnTheScreen();
    expect(screen.getByText('API base URL')).toBeOnTheScreen();
    expect(screen.getByText('http://localhost:8081/api/v1')).toBeOnTheScreen();
  });

  it('exposes the title as a header for screen readers', async () => {
    await renderWithProviders(
      <EnvironmentScreen
        title="Environment"
        environmentName="staging"
        rows={rows}
      />,
    );

    expect(
      screen.getByRole('header', { name: 'Environment' }),
    ).toBeOnTheScreen();
  });

  it('labels each row so it is announced as one unit', async () => {
    await renderWithProviders(
      <EnvironmentScreen
        title="Environment"
        environmentName="staging"
        rows={rows}
      />,
    );

    expect(
      screen.getByLabelText('API base URL: http://localhost:8081/api/v1'),
    ).toBeOnTheScreen();
  });

  it('renders without rows', async () => {
    await renderWithProviders(
      <EnvironmentScreen
        title="Environment"
        environmentName="production"
        rows={[]}
      />,
    );

    expect(screen.getByText('production')).toBeOnTheScreen();
  });
});
