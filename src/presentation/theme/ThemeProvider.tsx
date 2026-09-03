import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

import { isRTLLocale, type Direction } from './direction';
import { theme, type Theme } from './tokens';

type ThemeContextValue = {
  theme: Theme;
  isRTL: boolean;
  direction: Direction;
  setPreviewRTL: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Direction follows the active i18next language and updates on the same render as the
 * translations do, so switching language flips the layout without a restart. `initialRTL`
 * overrides it for the component gallery's side-by-side preview.
 */
export function ThemeProvider({
  children,
  initialRTL,
}: {
  children: ReactNode;
  initialRTL?: boolean;
}) {
  const { i18n } = useTranslation();
  const [previewRTL, setPreviewRTL] = useState<boolean | null>(
    initialRTL ?? null,
  );
  const localeRTL = isRTLLocale(i18n.language);
  const value = useMemo(() => {
    const isRTL = previewRTL ?? localeRTL;
    return {
      theme,
      isRTL,
      direction: (isRTL ? 'rtl' : 'ltr') as Direction,
      setPreviewRTL: (next: boolean) => setPreviewRTL(next),
    };
  }, [localeRTL, previewRTL]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Outside a provider — isolated component tests, mainly — direction still has to be right, so
 * it is derived from the same locale the provider would have used.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  const { i18n } = useTranslation();
  const isRTL = isRTLLocale(i18n.language);
  const detached = useMemo(
    () => ({
      theme,
      isRTL,
      direction: (isRTL ? 'rtl' : 'ltr') as Direction,
      setPreviewRTL: () => undefined,
    }),
    [isRTL],
  );
  return context ?? detached;
}
