/**
 * Expo configuration.
 *
 * Selects an environment file from APP_ENV (default: development), loads it,
 * and publishes the values through `extra` so the app reads configuration from
 * exactly one place. `src/infrastructure/config` validates them at startup.
 *
 * Switching environments is a command-line change, never a code change:
 *   APP_ENV=staging npx expo start
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ENVS = ['development', 'staging', 'production'] as const;
type AppEnv = (typeof APP_ENVS)[number];

function resolveAppEnv(): AppEnv {
  const raw = process.env['APP_ENV'] ?? 'development';
  if ((APP_ENVS as readonly string[]).includes(raw)) {
    return raw as AppEnv;
  }
  throw new Error(
    `APP_ENV must be one of ${APP_ENVS.join(', ')}. Received: "${raw}".`,
  );
}

const appEnv = resolveAppEnv();
const envFile = resolve(__dirname, `.env.${appEnv}`);

if (!existsSync(envFile)) {
  throw new Error(
    `Missing environment file ".env.${appEnv}". Copy .env.example and fill it in.`,
  );
}
loadEnv({ path: envFile, override: true });

const BUNDLE_IDS: Record<AppEnv, string> = {
  development: 'om.brandhub.app.dev',
  staging: 'om.brandhub.app.staging',
  production: 'om.brandhub.app',
};

const APP_NAMES: Record<AppEnv, string> = {
  development: 'BRANDHUB (dev)',
  staging: 'BRANDHUB (staging)',
  production: 'BRANDHUB',
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAMES[appEnv],
  slug: 'brandhub',
  scheme: 'brandhub',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  // Arabic-first, RTL. See architecture.md §14.4.
  locales: {},
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_IDS[appEnv],
  },
  android: {
    package: BUNDLE_IDS[appEnv],
    adaptiveIcon: {
      backgroundColor: '#EEEDF9',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F5F7',
        image: './assets/splash-icon.png',
        imageWidth: 200,
      },
    ],
    [
      // D15: minimum supported platforms. On SDK 54 these are set through the
      // build-properties plugin rather than on the ios/android config objects.
      'expo-build-properties',
      {
        ios: { deploymentTarget: '15.1' },
        android: { minSdkVersion: 26 },
      },
    ],
  ],
  experiments: {
    tsconfigPaths: true,
  },
  extra: {
    env: process.env['EXPO_PUBLIC_ENV'],
    apiBaseUrl: process.env['EXPO_PUBLIC_API_BASE_URL'],
    defaultLocale: process.env['EXPO_PUBLIC_DEFAULT_LOCALE'],
    requestTimeoutMs: process.env['EXPO_PUBLIC_REQUEST_TIMEOUT_MS'],
    enableDevMenu: process.env['EXPO_PUBLIC_ENABLE_DEV_MENU'],
  },
});
