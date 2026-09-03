import type { Session, User } from '@domain/identity';

import type { SessionDto, UserDto } from '@data/identity/dto';

export function mapUser(dto: UserDto): User {
  const seller = dto.role === 'ROLE_SELLER';
  const names = (dto.name ?? '').trim().split(/\s+/, 2);
  const phone = dto.phone ?? dto.phoneNumber;
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName || names[0] || dto.storeName || '',
    lastName: dto.lastName || names[1] || '',
    ...(phone ? { phone } : {}),
    accountType: seller ? 'seller' : 'customer',
  };
}

export function mapSession(dto: SessionDto): Session {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    user: mapUser(dto.user),
  };
}
