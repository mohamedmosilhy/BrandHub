import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { AddressRepository } from '@domain/addresses';
import type { AccountMetricsRepository, Session } from '@domain/identity';
import type { GetOrdersUseCase } from '@domain/orders';

import { Button, SegmentedControl } from '@presentation/components/controls';
import { Screen } from '@presentation/components/layout';
import {
  Icon,
  Pressable,
  Text,
  type IconName,
} from '@presentation/components/primitives';
import { Avatar, Card } from '@presentation/components/surfaces';
import { useWishlistContext } from '@presentation/features/wishlist';
import { formatPrice } from '@presentation/formatting';
import { useTheme } from '@presentation/theme';

/**
 * The nine rows the prototype's account hub lists, in its order. `Following` is the influencers
 * tab rather than a screen in this stack, so the navigator decides where each key lands.
 */
export type AccountDestination =
  | 'Orders'
  | 'Wishlist'
  | 'Addresses'
  | 'Wallet'
  | 'Gifts'
  | 'Support'
  | 'Profile'
  | 'Following'
  | 'Notifications';

const ROWS: readonly (readonly [AccountDestination, string, IconName])[] = [
  ['Orders', 'myOrders', 'cart'],
  ['Wishlist', 'myWishlist', 'heart'],
  ['Addresses', 'addresses', 'map-pin'],
  ['Wallet', 'wallet', 'star'],
  ['Gifts', 'gifts', 'plus'],
  ['Support', 'support', 'shield'],
  ['Profile', 'profile', 'person'],
  ['Following', 'following', 'grid'],
  ['Notifications', 'notifications', 'bell'],
];

/**
 * `+968 9•• ••• 42` — the prototype's masking. Only the country code and the last two digits
 * survive, so a shoulder-surfer learns nothing the customer did not already show them.
 */
export function maskPhone(phone: string | undefined): string | null {
  const digits = phone?.replace(/\D/g, '');
  if (!digits || digits.length < 6) return null;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 4)}•• ••• ${digits.slice(-2)}`;
}

export function AccountScreen({
  session,
  getOrders,
  addressRepository,
  metricsRepository,
  onNavigate,
  onChangeLanguage,
  onSignOut,
}: {
  session: Session;
  getOrders: GetOrdersUseCase;
  addressRepository: AddressRepository;
  metricsRepository: AccountMetricsRepository;
  onNavigate: (destination: AccountDestination) => void;
  onChangeLanguage: (locale: 'ar' | 'en') => void;
  onSignOut: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const wishlist = useWishlistContext();

  const orders = useQuery({
    queryKey: ['orders', 'account'],
    queryFn: async () => {
      // One page is enough for the hub's counters; the orders screen does the real paging.
      const result = await getOrders.execute(0, 100);
      if (!result.ok) throw result.error;
      return result.value;
    },
  });
  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const result = await addressRepository.list();
      if (!result.ok) throw result.error;
      return result.value;
    },
  });
  const metrics = useQuery({
    queryKey: ['account-metrics'],
    queryFn: async () => {
      const result = await metricsRepository.get();
      if (!result.ok) throw result.error;
      return result.value;
    },
  });

  const all = orders.data ?? [];
  const inProgress = all.filter(
    (order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED',
  ).length;
  const delivered = all.filter((order) => order.status === 'DELIVERED').length;

  /** A count that has not loaded shows nothing rather than a misleading zero. */
  const counts: Partial<Record<AccountDestination, string>> = {
    ...(orders.data ? { Orders: String(all.length) } : {}),
    ...(wishlist && !wishlist.isPending
      ? { Wishlist: String(wishlist.items.length) }
      : {}),
    ...(addresses.data ? { Addresses: String(addresses.data.length) } : {}),
    ...(metrics.data
      ? {
          Wallet: formatPrice(metrics.data.walletBalance),
          Support: String(metrics.data.ticketCount),
        }
      : {}),
  };

  const stats: readonly (readonly [number, string])[] = [
    [inProgress, t('statOrders')],
    [delivered, t('statDelivered')],
    [metrics.data?.returnCount ?? 0, t('underReview')],
  ];
  const phone = maskPhone(session.user.phone);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';

  return (
    <Screen accessibilityLabel={t('account')} edgeToEdge gap={0} paddingTop={0}>
      <View
        style={[
          styles.profile,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Avatar
          accessibilityLabel={`${session.user.firstName} ${session.user.lastName}`.trim()}
          initials={`${session.user.firstName[0] ?? ''}${session.user.lastName[0] ?? ''}`}
          size="lg"
        />
        <View style={styles.flex}>
          <Text variant="body" weight="extrabold">
            {`${session.user.firstName} ${session.user.lastName}`.trim()}
          </Text>
          <Text color={theme.colors.textMuted} latin variant="xs">
            {phone ?? session.user.email}
          </Text>
        </View>
        <Button
          label={t('edit')}
          size="sm"
          variant="secondary"
          onPress={() => onNavigate('Profile')}
        />
      </View>

      <View style={styles.stats}>
        {stats.map(([value, label]) => (
          <View key={label} style={styles.stat}>
            <Card>
              <Text align="center" latin variant="h3" weight="extrabold">
                {String(value)}
              </Text>
              <Text
                align="center"
                color={theme.colors.textSecondary}
                variant="micro"
              >
                {label}
              </Text>
            </Card>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.rows,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: 16,
          },
        ]}
      >
        {ROWS.map(([destination, key, icon], index) => (
          <Pressable
            key={destination}
            accessibilityLabel={t(key)}
            onPress={() => onNavigate(destination)}
            style={[
              styles.row,
              index > 0 && {
                borderTopColor: theme.colors.border,
                borderTopWidth: 1,
              },
            ]}
          >
            <View
              style={[
                styles.rowIcon,
                {
                  backgroundColor: theme.colors.background,
                  borderRadius: 10,
                },
              ]}
            >
              <Icon name={icon} color={theme.colors.accentHover} size={17} />
            </View>
            <Text style={styles.flex} variant="xs" weight="semibold">
              {t(key)}
            </Text>
            {counts[destination] ? (
              <Text color={theme.colors.textMuted} latin variant="micro">
                {counts[destination]}
              </Text>
            ) : null}
            <Icon
              name="chevron-forward"
              color={theme.colors.textMuted}
              size={17}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Card>
          <View style={styles.language}>
            <Text variant="xs" weight="semibold">
              {t('language')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('language')}
              // A language switch names each language in that language, as the prototype does.
              options={[
                { label: t('localeArabic'), value: 'ar' },
                { label: t('localeEnglish'), value: 'en' },
              ]}
              value={locale}
              onChange={(value) => onChangeLanguage(value as 'ar' | 'en')}
            />
          </View>
        </Card>
        <Button
          fullWidth
          label={t('signOut')}
          variant="danger"
          onPress={onSignOut}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 3 },
  footer: { gap: 10, padding: 16 },
  language: { gap: 10 },
  profile: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 13,
    padding: 18,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 14 },
  rowIcon: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rows: { borderWidth: 1, marginHorizontal: 16, overflow: 'hidden' },
  stat: { flex: 1 },
  stats: { flexDirection: 'row', gap: 10, padding: 16 },
});
