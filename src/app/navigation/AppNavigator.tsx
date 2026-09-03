import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  StackActions,
  createNavigationContainerRef,
  type RouteProp,
  useRoute,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import {
  BrandTabBar,
  type NavigationTab,
} from '@presentation/components/navigation';
import {
  LoginScreen,
  sessionStore,
  useSessionStore,
} from '@presentation/features/auth';
import { AccountScreen, ShellScreen } from '@presentation/features/navigation';
import { OnboardingScreen } from '@presentation/features/onboarding';

import { useContainer } from '@app/di';

import { linking } from './linking';
import { RequireAuth } from './RequireAuth';
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
  const { t } = useTranslation();
  return (
    <ShellScreen
      title={t('tabHome')}
      action={{
        label: t('discover'),
        onPress: () =>
          navigation.navigate('Product', { productId: 'product-1' }),
      }}
    />
  );
}

function BrowseRoute() {
  const { t } = useTranslation();
  return <ShellScreen title={t('tabCats')} />;
}

function InfluencersRoute() {
  const { t } = useTranslation();
  return <ShellScreen title={t('tabInf')} />;
}

function CartRoute() {
  const { t } = useTranslation();
  return (
    <ShellScreen
      title={t('tabCart')}
      action={{
        label: t('checkout'),
        onPress: () => navigationRef.navigate('Checkout'),
      }}
    />
  );
}

function ProductRoute() {
  const { t } = useTranslation();
  const route =
    useRoute<RouteProp<{ Product: { productId: string } }, 'Product'>>();
  return <ShellScreen title={t('product')} detail={route.params.productId} />;
}

function CategoryRoute() {
  const { t } = useTranslation();
  const route =
    useRoute<RouteProp<{ Category: { categoryId: string } }, 'Category'>>();
  return <ShellScreen title={t('category')} detail={route.params.categoryId} />;
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

function AccountRoute() {
  const { signOut, queryClient } = useContainer();
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

  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      {session ? (
        <AccountScreen
          session={session}
          onSignOut={() => void performSignOut()}
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
  const { t } = useTranslation();
  const returnTo = { kind: 'checkout' } as const;
  return (
    <RequireAuth returnTo={returnTo} onRequireAuth={requestAuth}>
      <ShellScreen title={t('checkoutTitle')} />
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
      <HomeStack.Screen name="Search" component={GenericRoute} />
      <HomeStack.Screen name="Product" component={ProductRoute} />
      <HomeStack.Screen name="Seller" component={GenericRoute} />
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
      <BrowseStack.Screen name="Search" component={GenericRoute} />
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
      <AccountStack.Screen name="Orders" component={AccountGatedRoute} />
      <AccountStack.Screen name="OrderDetail" component={AccountGatedRoute} />
      <AccountStack.Screen name="ReturnForm" component={AccountGatedRoute} />
      <AccountStack.Screen name="Addresses" component={AccountGatedRoute} />
      <AccountStack.Screen name="AddressForm" component={AccountGatedRoute} />
      <AccountStack.Screen name="Wallet" component={AccountGatedRoute} />
      <AccountStack.Screen name="Gifts" component={AccountGatedRoute} />
      <AccountStack.Screen name="Support" component={AccountGatedRoute} />
      <AccountStack.Screen name="Ticket" component={AccountGatedRoute} />
      <AccountStack.Screen name="Profile" component={AccountGatedRoute} />
      <AccountStack.Screen name="Wishlist" component={AccountGatedRoute} />
      <AccountStack.Screen name="Notifications" component={AccountGatedRoute} />
    </AccountStack.Navigator>
  );
}

function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const tabs: readonly NavigationTab[] = [
    { key: 'HomeTab', label: t('tabHome'), icon: 'home' },
    { key: 'BrowseTab', label: t('tabCats'), icon: 'search' },
    { key: 'InfluencersTab', label: t('tabInf'), icon: 'person' },
    { key: 'CartTab', label: t('tabCart'), icon: 'cart', badge: 0 },
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

export function AppNavigator() {
  const status = useSessionStore((state) => state.status);
  const onboardingComplete = useSessionStore(
    (state) => state.onboardingComplete,
  );
  if (status === 'loading') return null;
  return (
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
          <Root.Screen name="OrderConfirmation" component={RootGatedRoute} />
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
  );
}
