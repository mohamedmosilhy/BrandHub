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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import { createInstance } from 'i18next';
import { useState, type ReactElement, type ReactNode } from 'react';
import { initReactI18next, I18nextProvider } from 'react-i18next';

import { resources } from '@infrastructure/i18n/resources';

import { ToastProvider } from '@presentation/components/feedback';
import { ThemeProvider } from '@presentation/theme';

const testI18n = createInstance();
void testI18n.use(initReactI18next).init({
  resources,
  lng: 'ar',
  fallbackLng: 'ar',
  defaultNS: 'common',
  ns: ['common', 'states'],
  initAsync: false,
  interpolation: { escapeValue: false },
});

function AllProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { gcTime: Infinity, retry: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export async function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
export { renderWithProviders as render };
