import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type {
  Address,
  AddressRepository,
  DeleteAddressUseCase,
  SetDefaultAddressUseCase,
} from '@domain/addresses';

import { Button } from '@presentation/components/controls';
import {
  EmptyState,
  ErrorState,
  Skeleton,
  useToast,
} from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import { Modal, StatusPill } from '@presentation/components/surfaces';
import { useTheme } from '@presentation/theme';

export const ADDRESS_QUERY_KEY = ['addresses'] as const;

async function listOf(repository: AddressRepository) {
  const result = await repository.list();
  if (!result.ok) throw result.error;
  return result.value;
}

function AddressCard({
  address,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  address: Address;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          // The prototype rings the default address in the accent rather than badging it alone.
          borderColor: address.isDefault
            ? theme.colors.accent
            : theme.colors.border,
          borderRadius: 16,
        },
      ]}
    >
      <View style={styles.cardHead}>
        <Text variant="sm" weight="extrabold">
          {t(`addressLabel_${address.label}`)}
        </Text>
        {address.isDefault ? (
          <StatusPill label={t('defaultAddr')} tone="accent" />
        ) : null}
      </View>
      <Text variant="xs">{`${address.details} — ${address.city}`}</Text>
      <Text color={theme.colors.textMuted} latin variant="micro">
        {`${address.recipientName} · ${address.phone}`}
      </Text>
      <View style={styles.actions}>
        <Button
          label={t('editAddr')}
          size="sm"
          variant="secondary"
          onPress={onEdit}
        />
        {address.isDefault ? null : (
          <Button
            label={t('setDefault')}
            size="sm"
            variant="ghost"
            onPress={onSetDefault}
          />
        )}
        <Button
          label={t('deleteAddr')}
          size="sm"
          variant="ghost"
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

export function AddressesScreen({
  repository,
  setDefaultAddress,
  deleteAddress,
  onBack,
  onAdd,
  onEdit,
}: {
  repository: AddressRepository;
  setDefaultAddress: SetDefaultAddressUseCase;
  deleteAddress: DeleteAddressUseCase;
  onBack: () => void;
  onAdd: () => void;
  onEdit: (addressId: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);
  const [failure, setFailure] = useState('');

  const query = useQuery({
    queryKey: ADDRESS_QUERY_KEY,
    queryFn: () => listOf(repository),
  });

  /** Checkout reads its own address list, so both caches are refreshed after every write. */
  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ['checkout-addresses'] });
  }

  const makeDefault = useMutation({
    mutationFn: async (addressId: string) => {
      const result = await setDefaultAddress.execute(addressId);
      if (!result.ok) throw result.error;
      return result.value;
    },
    onSuccess: async (addresses) => {
      // BR7 is already enforced by the use case, so the list can be written straight into the
      // cache — the badge moves in the same frame as the press, before the refetch lands.
      queryClient.setQueryData(ADDRESS_QUERY_KEY, addresses);
      setFailure('');
      await refresh();
    },
    onError: () => setFailure(t('states:genericErrorBody')),
  });

  const remove = useMutation({
    mutationFn: async (addressId: string) => {
      const result = await deleteAddress.execute(addressId);
      if (!result.ok) throw result.error;
    },
    onSuccess: async () => {
      setFailure('');
      showToast({ message: t('addrDeleted'), tone: 'success' });
      await refresh();
    },
    onError: () => setFailure(t('states:genericErrorBody')),
  });

  return (
    <Screen
      accessibilityLabel={t('addresses')}
      edgeToEdge
      gap={0}
      paddingTop={0}
    >
      <ScreenHeader
        title={t('addresses')}
        backLabel={t('back')}
        onBack={onBack}
      />
      <View style={styles.page}>
        {failure ? (
          <Text color={theme.colors.dangerAccessible} variant="xs">
            {failure}
          </Text>
        ) : null}
        {query.isPending ? (
          <>
            <Skeleton accessibilityLabel={t('loading')} height={124} />
            <Skeleton accessibilityLabel={t('loading')} height={124} />
          </>
        ) : query.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void query.refetch()}
          />
        ) : query.data.length === 0 ? (
          <EmptyState
            title={t('states:addressesEmptyTitle')}
            body={t('states:addressesEmptyBody')}
            icon="map-pin"
          />
        ) : (
          query.data.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => onEdit(address.id)}
              onSetDefault={() => makeDefault.mutate(address.id)}
              onDelete={() => setPendingDelete(address)}
            />
          ))
        )}
        <Button fullWidth label={t('addAddress')} onPress={onAdd} />
      </View>

      {/* AC9.16 — deletion is destructive and irreversible, so it asks first and removes only on
          confirm. */}
      <Modal
        visible={pendingDelete !== null}
        title={t('deleteAddr')}
        closeLabel={t('cancel')}
        onClose={() => setPendingDelete(null)}
      >
        <Text variant="sm">{t('deleteAddressConfirm')}</Text>
        <Button
          fullWidth
          label={t('deleteAddr')}
          loading={remove.isPending}
          variant="danger"
          onPress={() => {
            const target = pendingDelete;
            setPendingDelete(null);
            if (target) remove.mutate(target.id);
          }}
        />
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 2 },
  card: { borderWidth: 1.5, gap: 9, padding: 14 },
  cardHead: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  page: { gap: 11, padding: 16 },
});
