import { createStore, type StoreApi } from 'zustand/vanilla';

import type { SessionStatus } from './ports';

export type SessionState = Readonly<{
  status: SessionStatus;
  setStatus: (status: SessionStatus) => void;
}>;

export function createSessionStateStore(): StoreApi<SessionState> {
  return createStore<SessionState>((set) => ({
    status: 'unknown',
    setStatus: (status) => set({ status }),
  }));
}
