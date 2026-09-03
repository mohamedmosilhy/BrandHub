import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Screen } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import { useSessionStore } from '@presentation/features/auth';

import type { ReturnTo } from './types';

export const gatedScreens = Object.freeze([
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
] as const);

export function RequireAuth({
  children,
  returnTo,
  onRequireAuth,
}: {
  children: ReactNode;
  returnTo: ReturnTo;
  onRequireAuth: (returnTo: ReturnTo) => void;
}) {
  const { t } = useTranslation();
  const status = useSessionStore((state) => state.status);
  useEffect(() => {
    if (status === 'guest') onRequireAuth(returnTo);
  }, [onRequireAuth, returnTo, status]);
  if (status !== 'authenticated') {
    return (
      <Screen accessibilityLabel={t('checkoutRequiresAuth')}>
        <Text>{t('checkoutRequiresAuth')}</Text>
      </Screen>
    );
  }
  return children;
}
