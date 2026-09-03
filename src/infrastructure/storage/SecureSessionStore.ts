import type { StoreApi } from 'zustand/vanilla';

import type { SecureStore, SessionTokens, TokenStore } from './ports';
import type { SessionState } from './sessionState';

export const SESSION_STORAGE_KEYS = Object.freeze({
  accessToken: 'brandhub.session.accessToken',
  refreshToken: 'brandhub.session.refreshToken',
});

export class SecureSessionStore implements TokenStore {
  constructor(
    private readonly secureStore: SecureStore,
    private readonly state: StoreApi<SessionState>,
  ) {}

  getAccessToken(): Promise<string | null> {
    return this.secureStore.get(SESSION_STORAGE_KEYS.accessToken);
  }

  getRefreshToken(): Promise<string | null> {
    return this.secureStore.get(SESSION_STORAGE_KEYS.refreshToken);
  }

  async saveTokens(tokens: SessionTokens): Promise<void> {
    await Promise.all([
      this.secureStore.set(
        SESSION_STORAGE_KEYS.accessToken,
        tokens.accessToken,
      ),
      this.secureStore.set(
        SESSION_STORAGE_KEYS.refreshToken,
        tokens.refreshToken,
      ),
    ]);
    this.state.getState().setStatus('authenticated');
  }

  async clearSession(): Promise<void> {
    await Promise.all([
      this.secureStore.delete(SESSION_STORAGE_KEYS.accessToken),
      this.secureStore.delete(SESSION_STORAGE_KEYS.refreshToken),
    ]);
    this.state.getState().setStatus('unauthenticated');
  }

  getStatus() {
    return this.state.getState().status;
  }
}
