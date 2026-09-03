import type { KeyValueStore, SecureStore } from './ports';
import { SecureSessionStore, SESSION_STORAGE_KEYS } from './SecureSessionStore';
import { createSessionStateStore } from './sessionState';

class MemoryStore implements SecureStore, KeyValueStore {
  readonly values = new Map<string, string>();

  async get(key: string) {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string) {
    this.values.set(key, value);
  }

  async delete(key: string) {
    this.values.delete(key);
  }
}

describe('SecureSessionStore', () => {
  it('writes tokens only to secure storage', async () => {
    const secure = new MemoryStore();
    const asyncStorage = new MemoryStore();
    const session = new SecureSessionStore(secure, createSessionStateStore());

    await session.saveTokens({
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    });

    expect(await secure.get(SESSION_STORAGE_KEYS.accessToken)).toBe(
      'access-secret',
    );
    expect(await secure.get(SESSION_STORAGE_KEYS.refreshToken)).toBe(
      'refresh-secret',
    );
    expect(await asyncStorage.get(SESSION_STORAGE_KEYS.accessToken)).toBeNull();
    expect(
      await asyncStorage.get(SESSION_STORAGE_KEYS.refreshToken),
    ).toBeNull();
    expect(session.getStatus()).toBe('authenticated');
  });

  it('clears both secure tokens and marks the session unauthenticated', async () => {
    const secure = new MemoryStore();
    const session = new SecureSessionStore(secure, createSessionStateStore());
    await session.saveTokens({
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    });

    await session.clearSession();

    expect(await session.getAccessToken()).toBeNull();
    expect(await session.getRefreshToken()).toBeNull();
    expect(session.getStatus()).toBe('unauthenticated');
  });
});
