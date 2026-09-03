import { createSessionStore } from './sessionStore';

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: {
    id: 'user-1',
    email: 'person@example.com',
    firstName: 'Sara',
    lastName: 'Ali',
    accountType: 'customer' as const,
  },
};

describe('session UI store', () => {
  it('restores authenticated state without an onboarding flash', () => {
    const store = createSessionStore();
    expect(store.getState().status).toBe('loading');
    store.getState().restore(session);
    expect(store.getState()).toMatchObject({
      status: 'authenticated',
      session,
      onboardingComplete: true,
    });
  });

  it('distinguishes first-run guest state from explicit guest entry', () => {
    const store = createSessionStore();
    store.getState().restore(null);
    expect(store.getState()).toMatchObject({
      status: 'guest',
      onboardingComplete: false,
    });
    store.getState().continueAsGuest();
    expect(store.getState().onboardingComplete).toBe(true);
    store.getState().resetToOnboarding();
    expect(store.getState()).toMatchObject({
      status: 'guest',
      session: null,
      onboardingComplete: false,
    });
  });

  it('accepts a newly authenticated session', () => {
    const store = createSessionStore();
    store.getState().authenticate(session);
    expect(store.getState().status).toBe('authenticated');
    expect(store.getState().session).toEqual(session);
  });
});
