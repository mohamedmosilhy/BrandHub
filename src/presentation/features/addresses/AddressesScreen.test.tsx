import { ok } from '@core/result';

import {
  DeleteAddressUseCase,
  SetDefaultAddressUseCase,
  type Address,
  type AddressRepository,
  type City,
} from '@domain/addresses';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { AddressesScreen } from './AddressesScreen';

function buildAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 'address-1',
    label: 'HOME',
    recipientName: 'Salim Al Rashdi',
    phone: '+96899112233',
    details: 'Building 24, Flat 3',
    city: 'Seeb' as City,
    country: 'OM',
    areaId: 'area-seeb',
    isDefault: true,
    ...overrides,
  };
}

function repository(initial: Address[]) {
  let addresses = [...initial];
  return {
    list: jest.fn(async () => ok(addresses as readonly Address[])),
    getById: jest.fn(async (id: string) =>
      ok(addresses.find((address) => address.id === id) as Address),
    ),
    create: jest.fn(),
    update: jest.fn(),
    setDefault: jest.fn(async (id: string) => {
      addresses = addresses.map((address) => ({
        ...address,
        isDefault: address.id === id,
      }));
      return ok(undefined);
    }),
    delete: jest.fn(async (id: string) => {
      addresses = addresses.filter((address) => address.id !== id);
      return ok(undefined);
    }),
  } as unknown as jest.Mocked<AddressRepository>;
}

async function mount(initial: Address[]) {
  const port = repository(initial);
  const onEdit = jest.fn();
  await renderWithProviders(
    <AddressesScreen
      repository={port}
      setDefaultAddress={new SetDefaultAddressUseCase(port)}
      deleteAddress={new DeleteAddressUseCase(port)}
      onBack={jest.fn()}
      onAdd={jest.fn()}
      onEdit={onEdit}
    />,
  );
  return { port, onEdit };
}

const home = buildAddress();
const work = buildAddress({
  id: 'address-2',
  label: 'WORK',
  details: 'Office 52, Knowledge Oasis',
  isDefault: false,
});

describe('AddressesScreen', () => {
  it('marks exactly one address as the default (BR7, AC9.13)', async () => {
    await mount([home, work]);

    await waitFor(() =>
      expect(screen.getByText('Building 24, Flat 3 — Seeb')).toBeOnTheScreen(),
    );
    expect(screen.getAllByLabelText('العنوان الافتراضي')).toHaveLength(1);
  });

  it('moves the default badge when another address is set as default', async () => {
    const { port } = await mount([home, work]);

    await waitFor(() => expect(screen.getByText('العمل')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('تعيين كافتراضي'));

    await waitFor(() =>
      expect(port.setDefault).toHaveBeenCalledWith('address-2'),
    );
    await waitFor(() =>
      expect(screen.getAllByLabelText('العنوان الافتراضي')).toHaveLength(1),
    );
    // Only the non-default card offers the action, so after the move it belongs to the other one.
    expect(screen.queryAllByLabelText('تعيين كافتراضي')).toHaveLength(1);
  });

  it('asks before deleting and removes nothing until confirmed (AC9.16)', async () => {
    const { port } = await mount([home, work]);

    await waitFor(() => expect(screen.getByText('العمل')).toBeOnTheScreen());
    fireEvent.press(screen.getAllByLabelText('حذف')[1]!);

    await waitFor(() =>
      expect(screen.getByText('هل تريد حذف هذا العنوان؟')).toBeOnTheScreen(),
    );
    expect(port.delete).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('إلغاء'));
    await waitFor(() =>
      expect(screen.queryByText('هل تريد حذف هذا العنوان؟')).toBeNull(),
    );
    expect(port.delete).not.toHaveBeenCalled();
  });

  it('deletes on confirm and reports it (AC9.16)', async () => {
    const { port } = await mount([home, work]);

    await waitFor(() => expect(screen.getByText('العمل')).toBeOnTheScreen());
    fireEvent.press(screen.getAllByLabelText('حذف')[1]!);
    await waitFor(() =>
      expect(screen.getByText('هل تريد حذف هذا العنوان؟')).toBeOnTheScreen(),
    );
    // The dialog's own destructive action, not the card's.
    fireEvent.press(screen.getAllByLabelText('حذف').at(-1)!);

    await waitFor(() => expect(port.delete).toHaveBeenCalledWith('address-2'));
    await waitFor(() =>
      expect(screen.getByText('تم حذف العنوان')).toBeOnTheScreen(),
    );
  });

  it('opens the form for the address whose edit action was pressed (AC9.15)', async () => {
    const { onEdit } = await mount([home, work]);

    await waitFor(() => expect(screen.getByText('العمل')).toBeOnTheScreen());
    fireEvent.press(screen.getAllByLabelText('تعديل')[1]!);

    expect(onEdit).toHaveBeenCalledWith('address-2');
  });

  it('shows the empty state when the account has no addresses (AC9.5 sibling)', async () => {
    await mount([]);

    await waitFor(() =>
      expect(screen.getByText('لم تضف عنواناً بعد')).toBeOnTheScreen(),
    );
  });
});
