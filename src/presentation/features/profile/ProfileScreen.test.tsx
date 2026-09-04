import { ok } from '@core/result';

import {
  UpdateProfileUseCase,
  type AuthRepository,
  type Session,
} from '@domain/identity';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { ProfileScreen } from './ProfileScreen';

const session: Session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: {
    id: 'user-customer',
    email: 'salim.rashdi@example.om',
    firstName: 'Salim',
    lastName: 'Al Rashdi',
    phone: '+96891234542',
    accountType: 'customer',
  },
};

async function mount() {
  const auth = {
    updateProfile: jest.fn(async () => ok(session)),
  } as unknown as jest.Mocked<AuthRepository>;
  const onBack = jest.fn();
  const onUpdated = jest.fn();
  await renderWithProviders(
    <ProfileScreen
      session={session}
      updateProfile={new UpdateProfileUseCase(auth)}
      onBack={onBack}
      onUpdated={onUpdated}
    />,
  );
  return { auth, onBack, onUpdated };
}

async function type(label: string, value: string) {
  fireEvent.changeText(screen.getByLabelText(label), value);
  await waitFor(() =>
    expect(screen.getByLabelText(label).props['value']).toBe(value),
  );
}

describe('ProfileScreen', () => {
  it('pre-fills the account’s name and phone, and locks the email', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('الاسم الأول').props['value']).toBe('Salim'),
    );
    expect(screen.getByLabelText('اسم العائلة').props['value']).toBe(
      'Al Rashdi',
    );
    expect(screen.getByLabelText('الهاتف').props['value']).toBe('+96891234542');
    expect(screen.getByLabelText('البريد الإلكتروني').props['editable']).toBe(
      false,
    );
  });

  it('saves the edited profile and hands the new session back (AC9.17)', async () => {
    const { auth, onUpdated, onBack } = await mount();

    await type('الاسم الأول', 'Salma');
    fireEvent.press(screen.getByLabelText('حفظ التغييرات'));

    await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledTimes(1));
    expect(auth.updateProfile).toHaveBeenCalledWith({
      firstName: 'Salma',
      lastName: 'Al Rashdi',
      email: 'salim.rashdi@example.om',
      phone: '+96891234542',
    });
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(session));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByText('تم تحديث الملف الشخصي')).toBeOnTheScreen();
  });

  it('shows the validation message and saves nothing when a field is invalid', async () => {
    const { auth, onBack } = await mount();

    await type('الاسم الأول', '  ');
    fireEvent.press(screen.getByLabelText('حفظ التغييرات'));

    await waitFor(() =>
      expect(
        screen.getByText('First and last name are required'),
      ).toBeOnTheScreen(),
    );
    expect(auth.updateProfile).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { auth, onBack } = await mount();

    // The header's back action and the form's cancel button share the label; either aborts.
    await waitFor(() =>
      expect(screen.getAllByLabelText('إلغاء')).toHaveLength(2),
    );
    fireEvent.press(screen.getAllByLabelText('إلغاء')[1]!);

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(auth.updateProfile).not.toHaveBeenCalled();
  });
});
