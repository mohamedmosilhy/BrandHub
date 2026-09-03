import { z } from 'zod';

import type { Session } from '@domain/identity';

import type { SecureStore, TokenStore } from '@infrastructure/storage';

const SESSION_USER_KEY = 'brandhub.session.user';
const storedUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  accountType: z.enum(['customer', 'seller']),
});

export class SessionLocalDataSource {
  constructor(
    private readonly secureStore: SecureStore,
    private readonly tokenStore: TokenStore,
  ) {}

  async save(session: Session): Promise<void> {
    await Promise.all([
      this.tokenStore.saveTokens(session),
      this.secureStore.set(SESSION_USER_KEY, JSON.stringify(session.user)),
    ]);
  }

  async load(): Promise<Session | null> {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      this.tokenStore.getAccessToken(),
      this.tokenStore.getRefreshToken(),
      this.secureStore.get(SESSION_USER_KEY),
    ]);
    if (!accessToken || !refreshToken || !userJson) return null;
    const user = storedUserSchema.safeParse(JSON.parse(userJson));
    if (!user.success) return null;
    const { phone, ...requiredUser } = user.data;
    return {
      accessToken,
      refreshToken,
      user: { ...requiredUser, ...(phone ? { phone } : {}) },
    };
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.tokenStore.clearSession(),
      this.secureStore.delete(SESSION_USER_KEY),
    ]);
  }
}
