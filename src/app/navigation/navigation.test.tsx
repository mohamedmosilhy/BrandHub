import { getStateFromPath } from '@react-navigation/native';

import { sessionStore } from '@presentation/features/auth';

import { renderWithProviders, screen, waitFor } from '@test/render';

import { linking } from './linking';
import { RequireAuth, gatedScreens } from './RequireAuth';
import { hidesTabBar } from './tabBarVisibility';

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

  it('stands the tab bar down on the screens that own their own bottom (AC7.11)', () => {
    expect(hidesTabBar('Product')).toBe(true);
    expect(hidesTabBar('Seller')).toBe(true);
    // Every account-stack screen past the hub is a full-screen page with its own back header.
    for (const route of [
      'Orders',
      'OrderDetail',
      'ReturnForm',
      'Addresses',
      'AddressForm',
      'Profile',
      'Wallet',
      'Gifts',
      'Support',
      'Ticket',
      'Wishlist',
      'Notifications',
    ]) {
      expect(hidesTabBar(route)).toBe(true);
    }
    expect(hidesTabBar('Home')).toBe(false);
    expect(hidesTabBar('Category')).toBe(false);
    // The account hub itself keeps the tabs; it is a tab root.
    expect(hidesTabBar('Account')).toBe(false);
    // No nested state yet — the tabs stay up rather than flickering away on first render.
    expect(hidesTabBar(undefined)).toBe(false);
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
