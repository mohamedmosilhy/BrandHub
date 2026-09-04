import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { OrderRepository } from '@domain/orders';

import { Button } from '@presentation/components/controls';
import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

async function orderOf(repository: OrderRepository, orderId: string) {
  const result = await repository.getById(orderId);
  if (!result.ok) throw result.error;
  return result.value;
}

export function OrderConfirmationScreen({
  orderId,
  repository,
  onContinue,
}: {
  orderId: string;
  repository: OrderRepository;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const order = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderOf(repository, orderId),
  });
  if (order.isPending) {
    return (
      <Screen accessibilityLabel={t('orderPlaced')} bottomInset>
        <Skeleton accessibilityLabel={t('loading')} height={240} />
      </Screen>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Screen accessibilityLabel={t('orderPlaced')} bottomInset>
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void order.refetch()}
        />
      </Screen>
    );
  }

  const timeline = [
    [t('trk1'), t('trk1Meta')],
    [t('trk2'), t('trk2Meta')],
    [t('trk3'), t('trk3Meta')],
    [t('trk4'), t('trk4Meta')],
  ] as const;
  return (
    <Screen
      accessibilityLabel={t('orderPlaced')}
      background={theme.colors.background}
      bottomInset
      edgeToEdge
      gap={0}
      scroll={false}
    >
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={theme.gradients.brand.colors}
          start={theme.gradients.brand.start}
          end={theme.gradients.brand.end}
          style={styles.hero}
        >
          <View
            style={[
              styles.successMark,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Icon
              name="check"
              color={theme.colors.successAccessible}
              size={34}
            />
          </View>
          <Text
            align="center"
            color={theme.colors.textInverse}
            variant="h2"
            weight="extrabold"
          >
            {t('orderPlaced')}
          </Text>
          <Text
            align="center"
            color={theme.colors.onDarkSecondary}
            variant="xs"
          >
            {t('orderPlacedSub')}
          </Text>
          <View
            style={[
              styles.orderNumber,
              { backgroundColor: theme.colors.onDarkSurface },
            ]}
          >
            <Text color={theme.colors.onDarkSecondary} variant="micro">
              {t('orderNumber')}
            </Text>
            <Text
              color={theme.colors.textInverse}
              latin
              variant="body"
              weight="extrabold"
            >
              {order.data.orderNumber}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text variant="sm" weight="extrabold">
            {t('tracking')}
          </Text>
          <View
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            {timeline.map(([label, meta], index) => {
              const completed = index < 2;
              return (
                <View key={label} style={styles.timelineRow}>
                  <View style={styles.timelineMarker}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: completed
                            ? theme.colors.successAccessible
                            : theme.colors.borderStrong,
                        },
                      ]}
                    >
                      {completed ? (
                        <Icon
                          name="check"
                          color={theme.colors.textInverse}
                          size={12}
                        />
                      ) : null}
                    </View>
                    {index < timeline.length - 1 ? (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: theme.colors.border },
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.timelineCopy}>
                    <Text
                      color={
                        completed
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary
                      }
                      variant="xs"
                      weight="bold"
                    >
                      {label}
                    </Text>
                    <Text color={theme.colors.textMuted} variant="micro">
                      {meta}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View
            style={[
              styles.courier,
              { backgroundColor: theme.colors.accentLight, borderRadius: 16 },
            ]}
          >
            <View
              style={[
                styles.courierIcon,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Icon name="truck" color={theme.colors.accentHover} />
            </View>
            <View style={styles.flex}>
              <Text variant="xs" weight="bold">
                {t('courier')}
              </Text>
              <Text color={theme.colors.textSecondary} variant="micro">
                {t('courierMeta')}
              </Text>
            </View>
          </View>
          <Button
            fullWidth
            label={t('continueShopping')}
            onPress={onContinue}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 15 },
  content: { gap: 13, padding: 16 },
  courier: { alignItems: 'center', flexDirection: 'row', gap: 11, padding: 13 },
  courierIcon: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  dot: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  flex: { flex: 1, gap: 3 },
  hero: {
    alignItems: 'center',
    gap: 9,
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 34,
  },
  orderNumber: {
    alignItems: 'center',
    borderRadius: 12,
    gap: 2,
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  page: { flexGrow: 1 },
  successMark: {
    alignItems: 'center',
    borderRadius: 31,
    height: 62,
    justifyContent: 'center',
    marginBottom: 3,
    width: 62,
  },
  timelineCopy: { flex: 1, gap: 3, paddingBottom: 18 },
  timelineLine: { flex: 1, marginVertical: 3, width: 2 },
  timelineMarker: { alignItems: 'center', width: 24 },
  timelineRow: { flexDirection: 'row', gap: 10, minHeight: 57 },
});
