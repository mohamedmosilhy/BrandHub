import * as Updates from 'expo-updates';
import { Alert, DevSettings, I18nManager } from 'react-native';

import { AsyncStorageAdapter } from '@infrastructure/storage';

import { i18n, type AppLocale } from './i18n';

const LOCALE_KEY = 'brandhub.locale';
const store = new AsyncStorageAdapter();

function asLocale(value: string | null): AppLocale | null {
  return value === 'ar' || value === 'en' ? value : null;
}

/**
 * The chosen language has to survive a restart, and a direction change *is* a restart (AC9.18),
 * so it is read back before the root component mounts rather than from inside a provider.
 * A read failure falls back to the configured default rather than blocking startup.
 */
export async function loadPersistedLanguage(): Promise<AppLocale> {
  try {
    return (
      asLocale(await store.get(LOCALE_KEY)) ?? (i18n.language as AppLocale)
    );
  } catch {
    return i18n.language as AppLocale;
  }
}

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

/**
 * Within one direction the switch is immediate. Crossing the LTR/RTL boundary needs a restart,
 * because `I18nManager.forceRTL` only takes effect on the next launch — so the prompt asks first
 * and the choice is persisted before the reload, never after it (AC9.18).
 */
export async function changeLanguage(locale: AppLocale): Promise<void> {
  const crossesDirection = isRTL(locale) !== I18nManager.isRTL;
  if (!crossesDirection) {
    await store.set(LOCALE_KEY, locale);
    await i18n.changeLanguage(locale);
    return;
  }

  confirmDirectionRestart(() => {
    void (async () => {
      await store.set(LOCALE_KEY, locale);
      await i18n.changeLanguage(locale);
      bootstrapDirection(locale);
      await reloadApp();
    })();
  });
}
