import {
  DeleteAddressUseCase,
  SaveAddressUseCase,
  SetDefaultAddressUseCase,
} from '@domain/addresses';
import {
  AddToCartUseCase,
  RemoveCartLineUseCase,
  UpdateCartLineUseCase,
} from '@domain/cart';
import {
  GetCategoryProductsUseCase,
  GetHomeSectionsUseCase,
  GetProductDetailUseCase,
  GetRelatedProductsUseCase,
  SearchProductsUseCase,
} from '@domain/catalog';
import {
  ApplyCouponUseCase,
  CalculateCartTotalsUseCase,
} from '@domain/checkout';
import {
  PhoneOtpUseCase,
  RefreshSessionUseCase,
  RestoreSessionUseCase,
  SignInUseCase,
  SignOutUseCase,
  SignUpUseCase,
  UpdateProfileUseCase,
} from '@domain/identity';
import {
  GetNotificationsUseCase,
  MarkAllReadUseCase,
} from '@domain/notifications';
import {
  GetOrderDetailUseCase,
  GetOrdersUseCase,
  PlaceOrderUseCase,
  RequestReturnUseCase,
} from '@domain/orders';
import {
  FollowInfluencerUseCase,
  GetInfluencerProfileUseCase,
  GetInfluencersUseCase,
} from '@domain/social';
import { ToggleWishlistUseCase } from '@domain/wishlist';

import {
  AddressRemoteDataSource,
  HttpAddressRepository,
} from '@data/addresses';
import {
  CartRemoteDataSource,
  CartRepositoryImpl,
  LocalCartDataSource,
  SessionAwareCartRepository,
} from '@data/cart';
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
  CheckoutRemoteDataSource,
  HttpCheckoutAddressRepository,
  HttpCouponRepository,
  HttpShippingAreaRepository,
} from '@data/checkout';
import {
  AccountRemoteDataSource,
  AuthRemoteDataSource,
  HttpAccountMetricsRepository,
  HttpAuthRepository,
  SessionLocalDataSource,
} from '@data/identity';
import {
  HttpNotificationRepository,
  NotificationRemoteDataSource,
} from '@data/notifications';
import { HttpOrderRepository, OrderRemoteDataSource } from '@data/orders';
import {
  InfluencerRemoteDataSource,
  MockInfluencerRepository,
} from '@data/social';
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
const updateProfile = new UpdateProfileUseCase(authRepository);
const accountMetricsRepository = new HttpAccountMetricsRepository(
  new AccountRemoteDataSource(httpClient),
);
const localCartRepository = new CartRepositoryImpl(
  new LocalCartDataSource(keyValueStore),
  resolveAssetUrl,
);
const remoteCartRepository = new CartRepositoryImpl(
  new CartRemoteDataSource(httpClient),
  resolveAssetUrl,
);
const cartRepository = new SessionAwareCartRepository(
  localCartRepository,
  remoteCartRepository,
  tokenStore,
);
const addToCart = new AddToCartUseCase(cartRepository);
const updateCartLine = new UpdateCartLineUseCase(cartRepository);
const removeCartLine = new RemoveCartLineUseCase(cartRepository);
const checkoutDataSource = new CheckoutRemoteDataSource(httpClient);
const couponRepository = new HttpCouponRepository(checkoutDataSource);
const shippingAreaRepository = new HttpShippingAreaRepository(
  checkoutDataSource,
);
const checkoutAddressRepository = new HttpCheckoutAddressRepository(
  checkoutDataSource,
);
const calculateCartTotals = new CalculateCartTotalsUseCase();
const applyCoupon = new ApplyCouponUseCase(couponRepository);
const orderRepository = new HttpOrderRepository(
  new OrderRemoteDataSource(httpClient),
  resolveAssetUrl,
);
const placeOrder = new PlaceOrderUseCase(cartRepository, orderRepository);
const getOrders = new GetOrdersUseCase(orderRepository);
const getOrderDetail = new GetOrderDetailUseCase(orderRepository);
const requestReturn = new RequestReturnUseCase(orderRepository);
const addressRepository = new HttpAddressRepository(
  new AddressRemoteDataSource(httpClient),
);
const saveAddress = new SaveAddressUseCase(addressRepository);
const setDefaultAddress = new SetDefaultAddressUseCase(addressRepository);
const deleteAddress = new DeleteAddressUseCase(addressRepository);
/**
 * Provisional by name (FA1). Influencers, shoppable posts and follows are the one feature area
 * with no backend contract, so the container binds `InfluencerRepository` to a mock-only
 * implementation. When the backend delivers GAP-1 this line is the whole migration.
 */
const influencerRepository = new MockInfluencerRepository(
  new InfluencerRemoteDataSource(httpClient),
  resolveAssetUrl,
);
const getInfluencers = new GetInfluencersUseCase(influencerRepository);
const getInfluencerProfile = new GetInfluencerProfileUseCase(
  influencerRepository,
);
const followInfluencer = new FollowInfluencerUseCase(influencerRepository);
const notificationRepository = new HttpNotificationRepository(
  new NotificationRemoteDataSource(httpClient),
);
const getNotifications = new GetNotificationsUseCase(notificationRepository);
const markAllRead = new MarkAllReadUseCase(notificationRepository);
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
  updateProfile,
  accountMetricsRepository,
  cartRepository,
  addToCart,
  updateCartLine,
  removeCartLine,
  couponRepository,
  shippingAreaRepository,
  checkoutAddressRepository,
  calculateCartTotals,
  applyCoupon,
  orderRepository,
  placeOrder,
  getOrders,
  getOrderDetail,
  requestReturn,
  addressRepository,
  saveAddress,
  setDefaultAddress,
  deleteAddress,
  influencerRepository,
  getInfluencers,
  getInfluencerProfile,
  followInfluencer,
  notificationRepository,
  getNotifications,
  markAllRead,
  queryClient,
});

export type AppContainer = typeof container;
