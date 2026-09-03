export interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export type SessionTokens = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface TokenStore {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  saveTokens(tokens: SessionTokens): Promise<void>;
  clearSession(): Promise<void>;
  getStatus(): SessionStatus;
}
