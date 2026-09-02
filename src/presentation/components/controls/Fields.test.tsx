import { render, screen } from '@test/render';

import { Input } from './Fields';

describe('Input', () => {
  it('renders its label, placeholder and error', async () => {
    await render(
      <Input
        label="Email"
        placeholder="name@example.com"
        error="Invalid email"
      />,
    );
    expect(screen.getByText('Email')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('name@example.com')).toBeOnTheScreen();
    expect(screen.getByText('Invalid email')).toBeOnTheScreen();
  });
});
