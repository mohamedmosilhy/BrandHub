import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type {
  Address,
  AddressDraft,
  AddressLabel,
  AddressRepository,
  SaveAddressUseCase,
} from '@domain/addresses';
import type { ShippingAreaRepository } from '@domain/checkout';

import {
  Button,
  Input,
  SegmentedControl,
  Select,
  TextArea,
  type Choice,
} from '@presentation/components/controls';
import { Skeleton, useToast } from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { ADDRESS_QUERY_KEY } from '@presentation/features/addresses/AddressesScreen';

const LABELS: readonly AddressLabel[] = ['HOME', 'WORK', 'OTHER'];

const BLANK: AddressDraft = {
  label: 'HOME',
  recipientName: '',
  phone: '+968',
  city: '',
  details: '',
};

/**
 * The city select is driven by `/areas` rather than a hard-coded list, so a city chosen here
 * always matches an area by name and the delivery price resolves exactly. It is the other half of
 * the workaround in `resolveAddressArea` (architecture.md §34.4).
 */
async function citiesOf(repository: ShippingAreaRepository): Promise<Choice[]> {
  const result = await repository.list();
  if (!result.ok) throw result.error;
  return result.value.map((area) => ({ label: area.name, value: area.name }));
}

function draftOf(address: Address): AddressDraft {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    city: address.city,
    details: address.details,
  };
}

/**
 * Split out and mounted under a key so the fields seed from `initial` through `useState` rather
 * than through an effect that writes five pieces of state after the first paint.
 */
function AddressFields({
  initial,
  cities,
  onSave,
}: {
  initial: AddressDraft;
  cities: readonly Choice[];
  onSave: (draft: AddressDraft) => Promise<string | null>;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function change<K extends keyof AddressDraft>(
    key: K,
    value: AddressDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setBusy(true);
    setError((await onSave(draft)) ?? '');
    setBusy(false);
  }

  return (
    <View style={styles.page}>
      <SegmentedControl
        accessibilityLabel={t('addressLabel')}
        options={LABELS.map((value) => ({
          label: t(`addressLabel_${value}`),
          value,
        }))}
        value={draft.label}
        onChange={(value) => change('label', value as AddressLabel)}
      />
      <Input
        label={t('fullName')}
        value={draft.recipientName}
        onChangeText={(value) => change('recipientName', value)}
      />
      <Input
        label={t('phoneLabel')}
        inputDirection="ltr"
        keyboardType="phone-pad"
        value={draft.phone}
        onChangeText={(value) => change('phone', value)}
      />
      <Select
        label={t('city')}
        placeholder={t('city')}
        options={cities}
        value={draft.city}
        onChange={(value) => change('city', value)}
      />
      <TextArea
        label={t('addrDetails')}
        value={draft.details}
        onChangeText={(value) => change('details', value)}
        {...(error ? { error } : {})}
      />
      <Button
        fullWidth
        label={t('saveAddr')}
        loading={busy}
        onPress={() => void submit()}
      />
    </View>
  );
}

export function AddressFormScreen({
  addressId,
  repository,
  shippingAreaRepository,
  saveAddress,
  onBack,
}: {
  /** Absent means create; present means edit, and the form pre-fills from the record (AC9.15). */
  addressId?: string;
  repository: AddressRepository;
  shippingAreaRepository: ShippingAreaRepository;
  saveAddress: SaveAddressUseCase;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const cities = useQuery({
    queryKey: ['shipping-areas'],
    queryFn: () => citiesOf(shippingAreaRepository),
  });
  const existing = useQuery({
    queryKey: ['addresses', addressId],
    queryFn: async () => {
      const result = await repository.getById(addressId as string);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: Boolean(addressId),
  });

  /** Returns the message to show under the details field, or `null` when the save succeeded. */
  async function save(draft: AddressDraft): Promise<string | null> {
    const result = await saveAddress.execute(addressId, draft);
    if (!result.ok) return result.error.message;
    await queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ['checkout-addresses'] });
    showToast({ message: t('addrSaved'), tone: 'success' });
    onBack();
    return null;
  }

  const title = t(addressId ? 'editAddr' : 'addAddress');
  const loading = Boolean(addressId) && !existing.data;
  return (
    <Screen
      accessibilityLabel={title}
      edgeToEdge
      gap={0}
      keyboardAware
      paddingTop={0}
    >
      <ScreenHeader title={title} backLabel={t('back')} onBack={onBack} />
      {loading ? (
        <View style={styles.page}>
          <Skeleton accessibilityLabel={t('loading')} height={280} />
        </View>
      ) : (
        <AddressFields
          key={existing.data?.id ?? 'new'}
          initial={existing.data ? draftOf(existing.data) : BLANK}
          cities={cities.data ?? []}
          onSave={save}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 13, padding: 16 },
});
