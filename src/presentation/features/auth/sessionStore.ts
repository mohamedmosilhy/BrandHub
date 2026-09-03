import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import type { Session } from '@domain/identity';

export type SessionStatus = 'loading' | 'authenticated' | 'guest';

export type SessionUiState = Readonly<{
  status: SessionStatus;
  session: Session | null;
  onboardingComplete: boolean;
  restore: (session: Session | null) => void;
  authenticate: (session: Session) => void;
  continueAsGuest: () => void;
  resetToOnboarding: () => void;
}>;

export function createSessionStore() {
  return createStore<SessionUiState>((set) => ({
    status: 'loading',
    session: null,
    onboardingComplete: false,
    restore: (session) =>
      set({
        status: session ? 'authenticated' : 'guest',
        session,
        onboardingComplete: Boolean(session),
      }),
    authenticate: (session) =>
      set({ status: 'authenticated', session, onboardingComplete: true }),
    continueAsGuest: () =>
      set({ status: 'guest', session: null, onboardingComplete: true }),
    resetToOnboarding: () =>
      set({ status: 'guest', session: null, onboardingComplete: false }),
  }));
}

export const sessionStore = createSessionStore();

export function useSessionStore<T>(selector: (state: SessionUiState) => T): T {
  return useStore(sessionStore, selector);
}
