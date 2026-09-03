import { getStateFromPath } from '@react-navigation/native';

import { sessionStore } from '@presentation/features/auth';

import { renderWithProviders, screen, waitFor } from '@test/render';

import { linking } from './linking';
import { RequireAuth, gatedScreens } from './RequireAuth';

describe('navigation shell contract', () => {
  it('parses the product deep link into the Home tab product stack', () => {
    const state = getStateFromPath('product/p1', linking.config);
    expect(JSON.stringify(state)).toContain('Product');
    expect(JSON.stringify(state)).toContain('p1');
  });

  it('keeps the exact D3 identity-bound screen inventory gated', () => {
    expect(gatedScreens).toEqual([
      'Checkout',
      'OrderConfirmation',
      'Wishlist',
      'Notifications',
      'Account',
      'Orders',
      'OrderDetail',
      'ReturnForm',
      'Addresses',
      'AddressForm',
      'Wallet',
      'Gifts',
      'Support',
      'Ticket',
      'Profile',
      'PaymentResult',
    ]);
    expect(gatedScreens).not.toContain('Cart');
    expect(gatedScreens).not.toContain('Product');
  });

  it('requests login with returnTo for a guest', async () => {
    sessionStore.getState().restore(null);
    const onRequireAuth = jest.fn();
    await renderWithProviders(
      <RequireAuth
        returnTo={{ kind: 'checkout' }}
        onRequireAuth={onRequireAuth}
      >
        <>private</>
      </RequireAuth>,
    );
    await waitFor(() =>
      expect(onRequireAuth).toHaveBeenCalledWith({ kind: 'checkout' }),
    );
    expect(screen.getByText('سجّل الدخول لإتمام الدفع')).toBeOnTheScreen();
  });
});
