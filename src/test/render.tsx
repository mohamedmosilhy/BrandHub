/**
 * The project's render helper.
 *
 * Every component test renders through this, so when the provider tree grows in
 * Phase 2 and Phase 5 (theme, i18n, query client, session) no test has to change.
 * Importing `@testing-library/react-native` also registers its matchers and its
 * automatic cleanup.
 *
 * Note: React Native Testing Library v14 made `render` asynchronous, so every
 * call site must await it.
 */
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

function AllProviders({ children }: { children: ReactNode }) {
  // Phase 1: no providers yet. Theme, i18n, query and session arrive in later
  // phases and are added here, once.
  return <>{children}</>;
}

export async function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
export { renderWithProviders as render };
