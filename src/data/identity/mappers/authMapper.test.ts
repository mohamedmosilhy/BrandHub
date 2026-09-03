import { mapSession, mapUser } from './authMapper';

describe('auth mapper', () => {
  it('maps a customer session without leaking transport role names', () => {
    expect(
      mapSession({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: 'user-1',
          email: 'person@example.com',
          firstName: 'Sara',
          lastName: 'Ali',
          phone: '+96899112233',
          role: 'ROLE_CUSTOMER',
        },
      }),
    ).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'user-1',
        email: 'person@example.com',
        firstName: 'Sara',
        lastName: 'Ali',
        phone: '+96899112233',
        accountType: 'customer',
      },
    });
  });

  it('maps alternate seller names and phone fields', () => {
    expect(
      mapUser({
        id: 'seller-1',
        email: 'shop@example.com',
        firstName: '',
        lastName: '',
        name: 'A2 Store',
        phoneNumber: '+96899223344',
        role: 'ROLE_SELLER',
      }),
    ).toMatchObject({
      firstName: 'A2',
      lastName: 'Store',
      phone: '+96899223344',
      accountType: 'seller',
    });
  });

  it('falls back to store name and omits an absent phone', () => {
    expect(
      mapUser({
        id: 'seller-2',
        email: 'shop2@example.com',
        firstName: '',
        lastName: '',
        storeName: 'BrandHub Shop',
        role: 'ROLE_SELLER',
      }),
    ).toEqual({
      id: 'seller-2',
      email: 'shop2@example.com',
      firstName: 'BrandHub Shop',
      lastName: '',
      accountType: 'seller',
    });
  });
});
