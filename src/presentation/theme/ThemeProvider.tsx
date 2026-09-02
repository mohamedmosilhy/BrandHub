import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { I18nManager } from 'react-native';

import { theme, type Theme } from './tokens';

type ThemeContextValue = {
  theme: Theme;
  isRTL: boolean;
  setPreviewRTL: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialRTL,
}: {
  children: ReactNode;
  initialRTL?: boolean;
}) {
  const [previewRTL, setPreviewRTL] = useState<boolean | null>(
    initialRTL ?? null,
  );
  const value = useMemo(
    () => ({
      theme,
      isRTL: previewRTL ?? I18nManager.isRTL,
      setPreviewRTL: (next: boolean) => setPreviewRTL(next),
    }),
    [previewRTL],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return (
    useContext(ThemeContext) ?? {
      theme,
      isRTL: I18nManager.isRTL,
      setPreviewRTL: () => undefined,
    }
  );
}
