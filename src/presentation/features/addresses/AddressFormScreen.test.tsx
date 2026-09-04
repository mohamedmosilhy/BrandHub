import { ok } from '@core/result';

import {
  SaveAddressUseCase,
  type Address,
  type AddressRepository,
  type City,
} from '@domain/addresses';
import type { ShippingArea, ShippingAreaRepository } from '@domain/checkout';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { AddressFormScreen } from './AddressFormScreen';

const areas = [
  { id: 'area-seeb', name: 'Seeb' },
  { id: 'area-muscat', name: 'Muscat' },
] as unknown as readonly ShippingArea[];

const stored: Address = {
  id: 'address-2',
  label: 'WORK',
  recipientName: 'Salim Al Rashdi',
  phone: '+96899112233',
  details: 'Office 52, Knowledge Oasis',
  city: 'Muscat' as City,
  country: 'OM',
  areaId: 'area-muscat',
  isDefault: false,
};

function repository() {
  return {
    list: jest.fn(async () => ok([stored])),
    getById: jest.fn(async () => ok(stored)),
    create: jest.fn(async () => ok(stored)),
    update: jest.fn(async () => ok(stored)),
    setDefault: jest.fn(async () => ok(undefined)),
    delete: jest.fn(async () => ok(undefined)),
  } as unknown as jest.Mocked<AddressRepository>;
}

async function mount(addressId?: string) {
  const port = repository();
  const onBack = jest.fn();
  await renderWithProviders(
    <AddressFormScreen
      {...(addressId ? { addressId } : {})}
      repository={port}
      shippingAreaRepository={
        { list: jest.fn(async () => ok(areas)) } as ShippingAreaRepository
      }
      saveAddress={new SaveAddressUseCase(port)}
      onBack={onBack}
    />,
  );
  return { port, onBack };
}

async function type(label: string, value: string) {
  fireEvent.changeText(screen.getByLabelText(label), value);
  await waitFor(() =>
    expect(screen.getByLabelText(label).props['value']).toBe(value),
  );
}

describe('AddressFormScreen', () => {
  it('rejects a phone that is not an Omani number and saves nothing', async () => {
    const { port, onBack } = await mount();

    await type('الاسم الكامل', 'Salim Al Rashdi');
    await type('الهاتف', '0501234567');
    await type('تفاصيل العنوان', 'Building 24');
    fireEvent.press(screen.getByLabelText('حفظ العنوان'));

    await waitFor(() =>
      expect(
        screen.getByText('Enter an Omani number after +968'),
      ).toBeOnTheScreen(),
    );
    expect(port.create).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('blocks a save with no city chosen', async () => {
    const { port } = await mount();

    await type('الاسم الكامل', 'Salim Al Rashdi');
    await type('الهاتف', '+96899112233');
    await type('تفاصيل العنوان', 'Building 24');
    fireEvent.press(screen.getByLabelText('حفظ العنوان'));

    await waitFor(() =>
      expect(screen.getByText('Choose a city')).toBeOnTheScreen(),
    );
    expect(port.create).not.toHaveBeenCalled();
  });

  it('offers the shipping areas as the city options, so the area always resolves', async () => {
    await mount();

    fireEvent.press(screen.getByLabelText('المدينة'));

    await waitFor(() => expect(screen.getByText('Seeb')).toBeOnTheScreen());
    expect(screen.getByText('Muscat')).toBeOnTheScreen();
  });

  it('creates a valid address, confirms it and goes back (AC9.14)', async () => {
    const { port, onBack } = await mount();

    await type('الاسم الكامل', 'Salim Al Rashdi');
    await type('الهاتف', '+968 9911 2233');
    await type('تفاصيل العنوان', 'Building 24, Flat 3');
    fireEvent.press(screen.getByLabelText('المدينة'));
    await waitFor(() => expect(screen.getByText('Seeb')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('Seeb'));

    await waitFor(() =>
      expect(
        screen.getByLabelText('المدينة').props['accessibilityState'].selected,
      ).toBe(true),
    );
    fireEvent.press(screen.getByLabelText('حفظ العنوان'));

    await waitFor(() => expect(port.create).toHaveBeenCalledTimes(1));
    expect(port.create.mock.calls[0]?.[0]).toMatchObject({
      recipientName: 'Salim Al Rashdi',
      phone: '+96899112233',
      details: 'Building 24, Flat 3',
      city: 'Seeb',
    });
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  });

  it('pre-fills from the stored record in edit mode and updates it (AC9.15)', async () => {
    const { port } = await mount('address-2');

    await waitFor(() =>
      expect(screen.getByLabelText('الاسم الكامل').props['value']).toBe(
        'Salim Al Rashdi',
      ),
    );
    expect(screen.getByLabelText('تفاصيل العنوان').props['value']).toBe(
      'Office 52, Knowledge Oasis',
    );
    expect(screen.getByText('Muscat')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('حفظ العنوان'));

    await waitFor(() => expect(port.update).toHaveBeenCalledTimes(1));
    expect(port.update.mock.calls[0]?.[0]).toBe('address-2');
    expect(port.create).not.toHaveBeenCalled();
  });
});
