import { NotoKufiArabic_400Regular } from '@expo-google-fonts/noto-kufi-arabic/400Regular';
import { NotoKufiArabic_500Medium } from '@expo-google-fonts/noto-kufi-arabic/500Medium';
import { NotoKufiArabic_600SemiBold } from '@expo-google-fonts/noto-kufi-arabic/600SemiBold';
import { NotoKufiArabic_700Bold } from '@expo-google-fonts/noto-kufi-arabic/700Bold';
import { NotoKufiArabic_800ExtraBold } from '@expo-google-fonts/noto-kufi-arabic/800ExtraBold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { useFonts } from 'expo-font';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { i18n } from '@infrastructure/i18n';

import { ToastProvider } from '@presentation/components';
import { ThemeProvider } from '@presentation/theme';

import { ContainerProvider } from '@app/di';
import { QueryProvider } from '@app/providers/QueryProvider';
import { SessionProvider } from '@app/providers/SessionProvider';

const fonts = {
  NotoKufiArabic_400Regular,
  NotoKufiArabic_500Medium,
  NotoKufiArabic_600SemiBold,
  NotoKufiArabic_700Bold,
  NotoKufiArabic_800ExtraBold,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
};

export function AppProviders({ children }: { children: ReactNode }) {
  const [loaded, error] = useFonts(fonts);
  if (!loaded && !error) return null;

  return (
    <ContainerProvider>
      <QueryProvider>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider>
            <ThemeProvider>
              <ToastProvider>
                <SessionProvider>{children}</SessionProvider>
              </ToastProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </I18nextProvider>
      </QueryProvider>
    </ContainerProvider>
  );
}
