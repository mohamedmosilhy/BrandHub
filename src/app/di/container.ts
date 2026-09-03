import { CategoryRemoteDataSource } from '@data/catalog/datasources';
import { CategoryRepositoryImpl } from '@data/catalog/repositories';

import { appConfig } from '@infrastructure/config';
import { AxiosHttpClient } from '@infrastructure/http';
import { i18n } from '@infrastructure/i18n';
import { Logger } from '@infrastructure/logging';
import {
  AsyncStorageAdapter,
  ExpoSecureStoreAdapter,
  SecureSessionStore,
  createSessionStateStore,
} from '@infrastructure/storage';

import { createAppQueryClient } from '@app/providers/queryClient';

const logger = new Logger();
const sessionState = createSessionStateStore();
const secureStore = new ExpoSecureStoreAdapter();
const keyValueStore = new AsyncStorageAdapter();
const tokenStore = new SecureSessionStore(secureStore, sessionState);
const httpClient = new AxiosHttpClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.requestTimeoutMs,
  tokenStore,
  localeProvider: () => i18n.language,
});
const categoryDataSource = new CategoryRemoteDataSource(httpClient);
const categoryRepository = new CategoryRepositoryImpl(categoryDataSource);
const queryClient = createAppQueryClient(logger);

export const container = Object.freeze({
  logger,
  sessionState,
  secureStore,
  keyValueStore,
  tokenStore,
  httpClient,
  categoryRepository,
  queryClient,
});

export type AppContainer = typeof container;
