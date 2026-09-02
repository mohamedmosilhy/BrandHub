import * as Updates from 'expo-updates';
import { Alert, DevSettings, I18nManager } from 'react-native';

import { i18n, type AppLocale } from './i18n';

export function isRTL(locale: string): boolean {
  return locale === 'ar';
}

export function bootstrapDirection(locale: string): void {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRTL(locale));
}

async function reloadApp(): Promise<void> {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  await Updates.reloadAsync();
}

export function confirmDirectionRestart(onConfirm: () => void): void {
  const arabic = i18n.language === 'ar';
  Alert.alert(
    arabic ? 'إعادة تشغيل مطلوبة' : 'Restart required',
    arabic
      ? 'سيعاد التطبيق التشغيل لتطبيق اتجاه اللغة.'
      : 'The app will restart to apply the new reading direction.',
    [
      { text: arabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
      { text: arabic ? 'متابعة' : 'Continue', onPress: onConfirm },
    ],
  );
}

export async function changeLanguage(locale: AppLocale): Promise<void> {
  const crossesDirection = isRTL(locale) !== I18nManager.isRTL;
  if (!crossesDirection) {
    await i18n.changeLanguage(locale);
    return;
  }

  confirmDirectionRestart(() => {
    void i18n.changeLanguage(locale).then(() => {
      bootstrapDirection(locale);
      return reloadApp();
    });
  });
}
