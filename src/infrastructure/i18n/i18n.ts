import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { appConfig } from '@infrastructure/config';

import { resources } from './resources';

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: appConfig.defaultLocale,
  fallbackLng: 'ar',
  defaultNS: 'common',
  ns: ['common', 'states'],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export type AppLocale = 'ar' | 'en';
