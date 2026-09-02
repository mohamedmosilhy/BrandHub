/**
 * Typed, validated access to the values published by `app.config.ts` `extra`.
 *
 * This is the ONLY module in the codebase permitted to read raw configuration.
 * Everything else imports the frozen `appConfig` object. See architecture.md §26.
 */
import Constants from 'expo-constants';

import { parseAppConfig, type AppConfig } from './schema';

function readExtra(): unknown {
  return Constants.expoConfig?.extra ?? {};
}

/** Validated configuration for the running app. Fails fast at import time. */
export const appConfig: AppConfig = parseAppConfig(readExtra());
