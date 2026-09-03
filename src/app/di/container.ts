import {
  GetCategoryProductsUseCase,
  GetHomeSectionsUseCase,
  GetProductDetailUseCase,
  GetRelatedProductsUseCase,
  SearchProductsUseCase,
} from '@domain/catalog';
import {
  PhoneOtpUseCase,
  RefreshSessionUseCase,
  RestoreSessionUseCase,
  SignInUseCase,
  SignOutUseCase,
  SignUpUseCase,
} from '@domain/identity';
import { ToggleWishlistUseCase } from '@domain/wishlist';

import {
  CategoryRemoteDataSource,
  ProductRemoteDataSource,
  ReviewRemoteDataSource,
  SellerRemoteDataSource,
} from '@data/catalog/datasources';
import {
  CategoryRepositoryImpl,
  HttpProductRepository,
  HttpReviewRepository,
  HttpSellerRepository,
} from '@data/catalog/repositories';
import {
  AuthRemoteDataSource,
  HttpAuthRepository,
  SessionLocalDataSource,
} from '@data/identity';
import {
  HttpWishlistRepository,
  WishlistRemoteDataSource,
} from '@data/wishlist';

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
const resolveAssetUrl = (value: string) =>
  value.startsWith('/')
    ? new URL(value, appConfig.apiBaseUrl).toString()
    : value;
const categoryDataSource = new CategoryRemoteDataSource(httpClient);
const categoryRepository = new CategoryRepositoryImpl(
  categoryDataSource,
  resolveAssetUrl,
);
const productDataSource = new ProductRemoteDataSource(httpClient);
const productRepository = new HttpProductRepository(
  productDataSource,
  resolveAssetUrl,
);
const reviewRepository = new HttpReviewRepository(
  new ReviewRemoteDataSource(httpClient),
);
const sellerRepository = new HttpSellerRepository(
  new SellerRemoteDataSource(httpClient),
  resolveAssetUrl,
);
const wishlistRepository = new HttpWishlistRepository(
  new WishlistRemoteDataSource(httpClient),
  resolveAssetUrl,
);
const searchProducts = new SearchProductsUseCase(productRepository);
const getProductDetail = new GetProductDetailUseCase(productRepository);
const getRelatedProducts = new GetRelatedProductsUseCase(productRepository);
const toggleWishlist = new ToggleWishlistUseCase(wishlistRepository);
const getCategoryProducts = new GetCategoryProductsUseCase(productRepository);
const getHomeSections = new GetHomeSectionsUseCase(
  productRepository,
  categoryRepository,
);
const authRemoteDataSource = new AuthRemoteDataSource(httpClient);
const sessionLocalDataSource = new SessionLocalDataSource(
  secureStore,
  tokenStore,
);
const authRepository = new HttpAuthRepository(
  authRemoteDataSource,
  sessionLocalDataSource,
);
const signIn = new SignInUseCase(authRepository);
const signUp = new SignUpUseCase(authRepository);
const signOut = new SignOutUseCase(authRepository);
const restoreSession = new RestoreSessionUseCase(authRepository);
const refreshSession = new RefreshSessionUseCase(authRepository);
const phoneOtp = new PhoneOtpUseCase(authRepository);
const queryClient = createAppQueryClient(logger);

export const container = Object.freeze({
  logger,
  sessionState,
  secureStore,
  keyValueStore,
  tokenStore,
  httpClient,
  categoryRepository,
  productRepository,
  reviewRepository,
  sellerRepository,
  wishlistRepository,
  searchProducts,
  getCategoryProducts,
  getHomeSections,
  getProductDetail,
  getRelatedProducts,
  toggleWishlist,
  authRepository,
  signIn,
  signUp,
  signOut,
  restoreSession,
  refreshSession,
  phoneOtp,
  queryClient,
});

export type AppContainer = typeof container;
