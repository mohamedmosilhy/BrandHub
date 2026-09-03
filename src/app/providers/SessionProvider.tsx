import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, type ReactNode } from 'react';

import { sessionStore } from '@presentation/features/auth';

import { useContainer } from '@app/di';

export function SessionProvider({ children }: { children: ReactNode }) {
  const { restoreSession, sessionState } = useContainer();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let mounted = true;
    void restoreSession.execute().then((result) => {
      if (!mounted) return;
      sessionStore.getState().restore(result.ok ? result.value : null);
      void SplashScreen.hideAsync();
    });
    const unsubscribe = sessionState.subscribe((state, previous) => {
      if (
        previous.status === 'authenticated' &&
        state.status === 'unauthenticated'
      ) {
        sessionStore.getState().resetToOnboarding();
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [restoreSession, sessionState]);

  return children;
}
