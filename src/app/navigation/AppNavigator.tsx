import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  StackActions,
  createNavigationContainerRef,
  getFocusedRouteNameFromRoute,
  type NavigationProp,
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { changeLanguage } from '@infrastructure/i18n';

import { useToast } from '@presentation/components/feedback';
import {
  BrandTabBar,
  type NavigationTab,
} from '@presentation/components/navigation';
import {
  AccountScreen,
  type AccountDestination,
} from '@presentation/features/account';
import {
  AddressesScreen,
  AddressFormScreen,
} from '@presentation/features/addresses';
import {
  LoginScreen,
  sessionStore,
  useSessionStore,
} from '@presentation/features/auth';
import { BrowseScreen } from '@presentation/features/browse';
import {
  CartProvider,
  CartScreen,
  useCartContext,
} from '@presentation/features/cart';
import { CategoryScreen } from '@presentation/features/category';
import { CheckoutScreen } from '@presentation/features/checkout';
import { HomeScreen } from '@presentation/features/home';
import { ShellScreen } from '@presentation/features/navigation';
import { OnboardingScreen } from '@presentation/features/onboarding';
import {
  OrderConfirmationScreen,
  OrderDetailScreen,
  OrdersScreen,
  ReturnFormScreen,
} from '@presentation/features/orders';
import { ProductScreen } from '@presentation/features/product';
import { ProfileScreen } from '@presentation/features/profile';
import { SearchScreen } from '@presentation/features/search';
import { SellerStoreScreen } from '@presentation/features/sellerStore';
import {
  WishlistProvider,
  WishlistScreen,
} from '@presentation/features/wishlist';
import { useTheme } from '@presentation/theme';

import { useContainer } from '@app/di';

import { linking } from './linking';
import { RequireAuth } from './RequireAuth';
import { hidesTabBar } from './tabBarVisibility';
import type {
  AccountStackParamList,
  AuthStackParamList,
  BrowseStackParamList,
  CartStackParamList,
  HomeStackParamList,
  InfluencersStackParamList,
  MainTabParamList,
  ReturnTo,
  RootStackParamList,
} from './types';

const Root = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>();
const InfluencersStack =
  createNativeStackNavigator<InfluencersStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const screenOptions = { headerShown: false } as const;

function OnboardingRoute({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'Onboarding'>) {
  const { phoneOtp } = useContainer();
  return (
    <OnboardingScreen
      phoneOtp={phoneOtp}
      onContinueAsGuest={() => {
        sessionStore.getState().continueAsGuest();
        navigationRef.resetRoot({ index: 0, routes: [{ name: 'Main' }] });
      }}
      onEmail={() => navigation.navigate('Login', { initialMode: 'signup' })}
    />
  );
}

function LoginRoute({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const { signIn, signUp } = useContainer();
  return (
    <LoginScreen
      {...(route.params?.initialMode
        ? { initialMode: route.params.initialMode }
        : {})}
      signIn={signIn}
      signUp={signUp}
      onBack={() => navigation.goBack()}
      onUsePhone={() => navigation.navigate('Onboarding')}
      onAuthenticated={(session) => {
        sessionStore.getState().authenticate(session);
        const returnTo = route.params?.returnTo;
        if (returnTo?.kind === 'checkout') {
          navigationRef.resetRoot({
            index: 1,
            routes: [{ name: 'Main' }, { name: 'Checkout' }],
          });
        } else if (returnTo?.kind === 'account') {
          navigationRef.resetRoot({
            index: 0,
            routes: [
              {
                name: 'Main',
                params: {
                  screen: 'AccountTab',
                  ...(returnTo.screen
                    ? { params: { screen: returnTo.screen } }
                    : {}),
                },
              },
            ],
          });
        } else {
          navigationRef.resetRoot({ index: 0, routes: [{ name: 'Main' }] });
        }
      }}
    />
  );
}

function HomeRoute({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'Home'>) {
  const { categoryRepository, productRepository, getProductDetail } =
    useContainer();
  return (
    <HomeScreen
      categoryRepository={categoryRepository}
      productRepository={productRepository}
      getProductDetail={getProductDetail}
      onSearch={() => navigation.navigate('Search')}
      onNotifications={() => navigation.navigate('Notifications')}
      onBrowse={() => navigationRef.navigate('Main', { screen: 'BrowseTab' })}
      onOpenCategory={(categoryId, categoryName) =>
        navigation.navigate('Category', { categoryId, categoryName })
      }
      onOpenProduct={(productId) =>
        navigation.navigate('Product', { productId })
      }
      onOpenInfluencer={(influencerId) =>
        navigation.navigate('Influencer', { influencerId })
      }
    />
  );
}

function BrowseRoute({
  navigation,
}: NativeStackScreenProps<BrowseStackParamList, 'Browse'>) {
  const { categoryRepository, getProductDetail, getCategoryProducts } =
    useContainer();
  return (
    <BrowseScreen
      categoryRepository={categoryRepository}
      getProductDetail={getProductDetail}
      getCategoryProducts={getCategoryProducts}
      onOpenProduct={(productId) =>
        navigation.navigate('Product', { productId })
      }
    />
  );
}

function InfluencersRoute() {
  const { t } = useTranslation();
  return <ShellScreen title={t('tabInf')} />;
}

function CartRoute() {
  const { shippingAreaRepository, calculateCartTotals } = useContainer();
  return (
    <CartScreen
      shippingAreaRepository={shippingAreaRepository}
      calculateTotals={calculateCartTotals}
      onCheckout={() => navigationRef.navigate('Checkout')}
      onDiscover={() => navigationRef.navigate('Main', { screen: 'BrowseTab' })}
    />
  );
}

function ProductRoute() {
  const {
    getProductDetail,
    getRelatedProducts,
    reviewRepository,
    sellerRepository,
  } = useContainer();
  const cart = useCartContext();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route =
    useRoute<RouteProp<{ Product: { productId: string } }, 'Product'>>();
  return (
    <ProductScreen
      productId={route.params.productId}
      getProductDetail={getProductDetail}
      getRelatedProducts={getRelatedProducts}
      reviewRepository={reviewRepository}
      sellerRepository={sellerRepository}
      onBack={() => navigation.goBack()}
      onCart={() => navigationRef.navigate('Main', { screen: 'CartTab' })}
      onOpenProduct={(productId) => navigation.push('Product', { productId })}
      onOpenSeller={(sellerId) => navigation.navigate('Seller', { sellerId })}
      onAddedToCart={(product, variant) => {
        void cart.add(product, variant).then((failure) =>
          showToast({
            message: failure ? t('cartUpdateFailed') : t('addedToCart'),
            tone: failure ? 'error' : 'success',
          }),
        );
      }}
      onBuyNow={(product, variant) => {
        void cart.add(product, variant).then((failure) => {
          if (failure) {
            showToast({ message: t('cartUpdateFailed'), tone: 'error' });
          } else {
            navigationRef.navigate('Checkout');
          }
        });
      }}
    />
  );
}

function SellerRoute() {
  const { sellerRepository, getProductDetail } = useContainer();
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const route =
    useRoute<RouteProp<{ Seller: { sellerId: string } }, 'Seller'>>();
  return (
    <SellerStoreScreen
      sellerId={route.params.sellerId}
      sellerRepository={sellerRepository}
      getProductDetail={getProductDetail}
      onBack={() => navigation.goBack()}
      onOpenProduct={(productId) =>
        navigation.navigate('Product', { productId })
      }
      onViewAll={(sellerId) => navigation.navigate('Search', { sellerId })}
    />
  );
}

function WishlistRoute() {
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  const returnTo = { kind: 'account', screen: 'Wishlist' } as const;
  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      <WishlistScreen
        onBack={() => navigation.goBack()}
        onDiscover={() =>
          navigationRef.navigate('Main', { screen: 'BrowseTab' })
        }
        onOpenProduct={(productId) =>
          navigationRef.navigate('Main', {
            screen: 'HomeTab',
            params: { screen: 'Product', params: { productId } },
          })
        }
        onAddToCart={(productId) =>
          navigationRef.navigate('Main', {
            screen: 'HomeTab',
            params: { screen: 'Product', params: { productId } },
          })
        }
      />
    </RequireAuth>
  );
}

function CategoryRoute() {
  const { categoryRepository, getProductDetail, getCategoryProducts } =
    useContainer();
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const route =
    useRoute<RouteProp<{ Category: { categoryId: string } }, 'Category'>>();
  return (
    <CategoryScreen
      categoryId={route.params.categoryId}
      categoryRepository={categoryRepository}
      getProductDetail={getProductDetail}
      getCategoryProducts={getCategoryProducts}
      onBack={() => navigation.goBack()}
      onSearch={(categoryId) => navigation.navigate('Search', { categoryId })}
      onOpenProduct={(productId) =>
        navigation.navigate('Product', { productId })
      }
    />
  );
}

function SearchRoute() {
  const { getProductDetail, searchProducts } = useContainer();
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const route =
    useRoute<RouteProp<{ Search: HomeStackParamList['Search'] }, 'Search'>>();
  return (
    <SearchScreen
      {...(route.params?.query ? { initialQuery: route.params.query } : {})}
      {...(route.params?.sellerId ? { sellerId: route.params.sellerId } : {})}
      {...(route.params?.categoryId
        ? { categoryId: route.params.categoryId }
        : {})}
      getProductDetail={getProductDetail}
      searchProducts={searchProducts}
      onBack={() => navigation.goBack()}
      onOpenProduct={(productId) =>
        navigation.navigate('Product', { productId })
      }
    />
  );
}

function GenericRoute() {
  const route = useRoute();
  return <ShellScreen title={route.name} />;
}

const requestAuth = (returnTo: ReturnTo) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Auth', {
      screen: 'Login',
      params: { initialMode: 'signin', returnTo },
    });
  }
};

function NotificationsRoute() {
  const { t } = useTranslation();
  const returnTo = { kind: 'account', screen: 'Notifications' } as const;
  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      <ShellScreen title={t('notifications')} />
    </RequireAuth>
  );
}

/**
 * Eight of the hub's nine rows are screens in this stack. `Following` is the influencers tab, so
 * the mapping lives here rather than in the screen — the screen names a destination, the
 * navigator decides what that means.
 */
function AccountRoute() {
  const {
    signOut,
    queryClient,
    getOrders,
    addressRepository,
    accountMetricsRepository,
  } = useContainer();
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  const session = useSessionStore((state) => state.session);
  const reset = useSessionStore((state) => state.resetToOnboarding);
  const returnTo = { kind: 'account' } as const;

  async function performSignOut() {
    await signOut.execute();
    queryClient.clear();
    reset();
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'Onboarding' } }],
    });
  }

  function go(destination: AccountDestination) {
    if (destination === 'Following') {
      navigationRef.navigate('Main', { screen: 'InfluencersTab' });
      return;
    }
    navigation.navigate(destination);
  }

  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      {session ? (
        <AccountScreen
          session={session}
          getOrders={getOrders}
          addressRepository={addressRepository}
          metricsRepository={accountMetricsRepository}
          onNavigate={go}
          onChangeLanguage={(locale) => void changeLanguage(locale)}
          onSignOut={() => void performSignOut()}
        />
      ) : null}
    </RequireAuth>
  );
}

function OrdersRoute() {
  const { getOrders } = useContainer();
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  return (
    <RequireAuth
      returnTo={{ kind: 'account', screen: 'Orders' }}
      onRequireAuth={requestAuth}
    >
      <OrdersScreen
        getOrders={getOrders}
        onBack={() => navigation.goBack()}
        onOrder={(orderId) => navigation.navigate('OrderDetail', { orderId })}
      />
    </RequireAuth>
  );
}

function OrderDetailRoute() {
  const { getOrderDetail, addressRepository } = useContainer();
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  const { orderId } =
    useRoute<RouteProp<AccountStackParamList, 'OrderDetail'>>().params;
  return (
    <RequireAuth
      returnTo={{ kind: 'account', screen: 'OrderDetail' }}
      onRequireAuth={requestAuth}
    >
      <OrderDetailScreen
        orderId={orderId}
        getOrder={getOrderDetail}
        addressRepository={addressRepository}
        onBack={() => navigation.goBack()}
        onReturn={(orderNumber) =>
          navigation.navigate('ReturnForm', { orderId, orderNumber })
        }
        // AC9.12 — support opens with the order already selected.
        onSupport={() => navigation.navigate('Support', { orderId })}
      />
    </RequireAuth>
  );
}

function ReturnFormRoute() {
  const { requestReturn } = useContainer();
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  const { orderId, orderNumber } =
    useRoute<RouteProp<AccountStackParamList, 'ReturnForm'>>().params;
  return (
    <RequireAuth
      returnTo={{ kind: 'account', screen: 'ReturnForm' }}
      onRequireAuth={requestAuth}
    >
      <ReturnFormScreen
        orderId={orderId}
        {...(orderNumber ? { orderNumber } : {})}
        requestReturn={requestReturn}
        onBack={() => navigation.goBack()}
        // AC9.11 — a submitted return lands back on the orders list, not on the form.
        onSubmitted={() => navigation.navigate('Orders')}
      />
    </RequireAuth>
  );
}

function AddressesRoute() {
  const { addressRepository, setDefaultAddress, deleteAddress } =
    useContainer();
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  return (
    <RequireAuth
      returnTo={{ kind: 'account', screen: 'Addresses' }}
      onRequireAuth={requestAuth}
    >
      <AddressesScreen
        repository={addressRepository}
        setDefaultAddress={setDefaultAddress}
        deleteAddress={deleteAddress}
        onBack={() => navigation.goBack()}
        onAdd={() => navigation.navigate('AddressForm')}
        onEdit={(addressId) =>
          navigation.navigate('AddressForm', { addressId })
        }
      />
    </RequireAuth>
  );
}

function AddressFormRoute() {
  const { addressRepository, shippingAreaRepository, saveAddress } =
    useContainer();
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  const addressId =
    useRoute<RouteProp<AccountStackParamList, 'AddressForm'>>().params
      ?.addressId;
  return (
    <RequireAuth
      returnTo={{ kind: 'account', screen: 'AddressForm' }}
      onRequireAuth={requestAuth}
    >
      <AddressFormScreen
        {...(addressId ? { addressId } : {})}
        repository={addressRepository}
        shippingAreaRepository={shippingAreaRepository}
        saveAddress={saveAddress}
        onBack={() => navigation.goBack()}
      />
    </RequireAuth>
  );
}

function ProfileRoute() {
  const { updateProfile } = useContainer();
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  const session = useSessionStore((state) => state.session);
  return (
    <RequireAuth
      returnTo={{ kind: 'account', screen: 'Profile' }}
      onRequireAuth={requestAuth}
    >
      {session ? (
        <ProfileScreen
          session={session}
          updateProfile={updateProfile}
          onBack={() => navigation.goBack()}
          onUpdated={(value) => sessionStore.getState().authenticate(value)}
        />
      ) : null}
    </RequireAuth>
  );
}

function AccountGatedRoute() {
  const route = useRoute();
  const returnTo = {
    kind: 'account',
    screen: route.name as keyof AccountStackParamList,
  } as const;
  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      <ShellScreen title={route.name} />
    </RequireAuth>
  );
}

function CheckoutRoute() {
  const {
    checkoutAddressRepository,
    shippingAreaRepository,
    calculateCartTotals,
    placeOrder,
  } = useContainer();
  const returnTo = { kind: 'checkout' } as const;
  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      <CheckoutScreen
        addressRepository={checkoutAddressRepository}
        shippingAreaRepository={shippingAreaRepository}
        calculateTotals={calculateCartTotals}
        placeOrder={placeOrder}
        onBack={() => navigationRef.goBack()}
        onPlaced={(orderId) =>
          navigationRef.dispatch(
            StackActions.replace('OrderConfirmation', { orderId }),
          )
        }
      />
    </RequireAuth>
  );
}

function OrderConfirmationRoute() {
  const { orderRepository } = useContainer();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>();
  const returnTo = { kind: 'account' } as const;
  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      <OrderConfirmationScreen
        orderId={route.params.orderId}
        repository={orderRepository}
        onContinue={() =>
          navigationRef.resetRoot({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'HomeTab' } }],
          })
        }
      />
    </RequireAuth>
  );
}

function RootGatedRoute() {
  const route = useRoute();
  const returnTo = { kind: 'account' } as const;
  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      <ShellScreen title={route.name} />
    </RequireAuth>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Home" component={HomeRoute} />
      <HomeStack.Screen name="Category" component={CategoryRoute} />
      <HomeStack.Screen name="Search" component={SearchRoute} />
      <HomeStack.Screen name="Product" component={ProductRoute} />
      <HomeStack.Screen name="Seller" component={SellerRoute} />
      <HomeStack.Screen name="Influencer" component={GenericRoute} />
      <HomeStack.Screen name="Notifications" component={NotificationsRoute} />
    </HomeStack.Navigator>
  );
}

function BrowseNavigator() {
  return (
    <BrowseStack.Navigator screenOptions={screenOptions}>
      <BrowseStack.Screen name="Browse" component={BrowseRoute} />
      <BrowseStack.Screen name="Category" component={CategoryRoute} />
      <BrowseStack.Screen name="Search" component={SearchRoute} />
      <BrowseStack.Screen name="Product" component={ProductRoute} />
    </BrowseStack.Navigator>
  );
}

function InfluencersNavigator() {
  return (
    <InfluencersStack.Navigator screenOptions={screenOptions}>
      <InfluencersStack.Screen
        name="Influencers"
        component={InfluencersRoute}
      />
      <InfluencersStack.Screen name="Influencer" component={GenericRoute} />
      <InfluencersStack.Screen name="Product" component={ProductRoute} />
    </InfluencersStack.Navigator>
  );
}

function CartNavigator() {
  return (
    <CartStack.Navigator screenOptions={screenOptions}>
      <CartStack.Screen name="Cart" component={CartRoute} />
    </CartStack.Navigator>
  );
}

function AccountNavigator() {
  return (
    <AccountStack.Navigator screenOptions={screenOptions}>
      <AccountStack.Screen name="Account" component={AccountRoute} />
      <AccountStack.Screen name="Orders" component={OrdersRoute} />
      <AccountStack.Screen name="OrderDetail" component={OrderDetailRoute} />
      <AccountStack.Screen name="ReturnForm" component={ReturnFormRoute} />
      <AccountStack.Screen name="Addresses" component={AddressesRoute} />
      <AccountStack.Screen name="AddressForm" component={AddressFormRoute} />
      <AccountStack.Screen name="Wallet" component={AccountGatedRoute} />
      <AccountStack.Screen name="Gifts" component={AccountGatedRoute} />
      <AccountStack.Screen name="Support" component={AccountGatedRoute} />
      <AccountStack.Screen name="Ticket" component={AccountGatedRoute} />
      <AccountStack.Screen name="Profile" component={ProfileRoute} />
      <AccountStack.Screen name="Wishlist" component={WishlistRoute} />
      <AccountStack.Screen name="Notifications" component={AccountGatedRoute} />
    </AccountStack.Navigator>
  );
}

function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const cart = useCartContext();
  const focused = state.routes[state.index];
  if (focused) {
    if (hidesTabBar(getFocusedRouteNameFromRoute(focused))) return null;
  }
  const tabs: readonly NavigationTab[] = [
    { key: 'HomeTab', label: t('tabHome'), icon: 'home' },
    // The prototype's tab glyphs: a four-square grid for categories and a star for creators.
    { key: 'BrowseTab', label: t('tabCats'), icon: 'grid' },
    { key: 'InfluencersTab', label: t('tabInf'), icon: 'star' },
    { key: 'CartTab', label: t('tabCart'), icon: 'cart', badge: cart.count },
    { key: 'AccountTab', label: t('tabMe'), icon: 'person' },
  ];
  return (
    <BrandTabBar
      tabs={tabs}
      activeIndex={state.index}
      onPress={(index) => {
        const route = state.routes[index];
        if (!route) return;
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (event.defaultPrevented) return;
        if (state.index === index && route.state?.key) {
          navigation.dispatch({
            ...StackActions.popToTop(),
            target: route.state.key,
          });
        } else {
          navigation.navigate(route.name);
        }
      }}
    />
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={screenOptions}
      tabBar={(props) => <MainTabBar {...props} />}
    >
      <Tabs.Screen name="HomeTab" component={HomeNavigator} />
      <Tabs.Screen name="BrowseTab" component={BrowseNavigator} />
      <Tabs.Screen name="InfluencersTab" component={InfluencersNavigator} />
      <Tabs.Screen name="CartTab" component={CartNavigator} />
      <Tabs.Screen name="AccountTab" component={AccountNavigator} />
    </Tabs.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen name="Onboarding" component={OnboardingRoute} />
      <AuthStack.Screen name="Login" component={LoginRoute} />
    </AuthStack.Navigator>
  );
}

/**
 * The wishlist sits above the navigator rather than inside a screen: every heart in the app —
 * home, browse, category, search, the PDP, the wishlist itself — has to read one membership set,
 * and a guest tapping one is sent to sign-in with the wishlist as its return (D3).
 */
function AppWishlistProvider({ children }: { children: ReactNode }) {
  const { wishlistRepository, toggleWishlist } = useContainer();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const status = useSessionStore((state) => state.status);
  return (
    <WishlistProvider
      repository={wishlistRepository}
      toggleWishlist={toggleWishlist}
      locale={i18n.resolvedLanguage ?? i18n.language}
      authenticated={status === 'authenticated'}
      onRequireAuth={() => requestAuth({ kind: 'account', screen: 'Wishlist' })}
      onFailure={() =>
        showToast({ message: t('wishlistFailed'), tone: 'error' })
      }
    >
      {children}
    </WishlistProvider>
  );
}

function AppCartProvider({ children }: { children: ReactNode }) {
  const {
    cartRepository,
    addToCart,
    updateCartLine,
    removeCartLine,
    applyCoupon,
  } = useContainer();
  const status = useSessionStore((state) => state.status);
  return (
    <CartProvider
      repository={cartRepository}
      addToCart={addToCart}
      updateCartLine={updateCartLine}
      removeCartLine={removeCartLine}
      applyCoupon={applyCoupon}
      sessionKey={status}
    >
      {children}
    </CartProvider>
  );
}

export function AppNavigator() {
  const { direction } = useTheme();
  const status = useSessionStore((state) => state.status);
  const onboardingComplete = useSessionStore(
    (state) => state.onboardingComplete,
  );
  if (status === 'loading') return null;
  return (
    <View style={{ direction, flex: 1 }}>
      <AppWishlistProvider>
        <AppCartProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <Root.Navigator
              key={onboardingComplete ? 'main' : 'auth'}
              initialRouteName={onboardingComplete ? 'Main' : 'Auth'}
              screenOptions={screenOptions}
            >
              <Root.Screen name="Auth" component={AuthNavigator} />
              <Root.Screen name="Main" component={MainTabs} />
              <Root.Group
                screenOptions={{ headerShown: false, presentation: 'modal' }}
              >
                <Root.Screen name="Checkout" component={CheckoutRoute} />
                <Root.Screen
                  name="OrderConfirmation"
                  component={OrderConfirmationRoute}
                />
                <Root.Screen name="PaymentResult" component={RootGatedRoute} />
              </Root.Group>
              <Root.Group
                screenOptions={{
                  headerShown: false,
                  presentation: 'transparentModal',
                }}
              >
                <Root.Screen name="FilterSheet" component={GenericRoute} />
              </Root.Group>
            </Root.Navigator>
          </NavigationContainer>
        </AppCartProvider>
      </AppWishlistProvider>
    </View>
  );
}
