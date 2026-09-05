import type { NavigatorScreenParams } from '@react-navigation/native';

export type SearchCriteria = Readonly<{
  query?: string;
  categoryId?: string;
  sellerId?: string;
}>;

export type HomeStackParamList = {
  Home: undefined;
  Category: { categoryId: string; categoryName?: string };
  Search:
    { query?: string; sellerId?: string; categoryId?: string } | undefined;
  Product: { productId: string };
  Seller: { sellerId: string };
  Influencer: { influencerId: string };
  Notifications: undefined;
};

export type BrowseStackParamList = {
  Browse: undefined;
  Category: { categoryId: string; categoryName?: string };
  Search:
    { query?: string; sellerId?: string; categoryId?: string } | undefined;
  Product: { productId: string };
};

export type InfluencersStackParamList = {
  Influencers: undefined;
  Influencer: { influencerId: string };
  Product: { productId: string };
};

export type CartStackParamList = { Cart: undefined };

export type AccountStackParamList = {
  Account: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  ReturnForm: { orderId: string; orderNumber?: string };
  Addresses: undefined;
  AddressForm: { addressId?: string } | undefined;
  Wallet: undefined;
  Gifts: undefined;
  Support: { orderId?: string } | undefined;
  Ticket: { ticketId: string };
  Profile: undefined;
  Wishlist: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  BrowseTab: NavigatorScreenParams<BrowseStackParamList> | undefined;
  InfluencersTab: NavigatorScreenParams<InfluencersStackParamList> | undefined;
  CartTab: NavigatorScreenParams<CartStackParamList> | undefined;
  AccountTab: NavigatorScreenParams<AccountStackParamList> | undefined;
};

export type ReturnTo =
  | Readonly<{ kind: 'checkout' }>
  | Readonly<{ kind: 'account'; screen?: keyof AccountStackParamList }>;

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: { initialMode?: 'signin' | 'signup'; returnTo?: ReturnTo } | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  PaymentResult: {
    status: 'success' | 'failed' | 'pending';
    amount: string;
    reference?: string;
    /**
     * The gateway's own order id, which `GET /payments/PAYMOB/status` answers about. Present
     * whenever the charge that started the payment is known, and absent only when the app was
     * handed a return it cannot attribute — in which case the screen stays pending rather than
     * claiming an outcome.
     */
    gatewayOrderId?: string;
  };
  FilterSheet: { initial: SearchCriteria; returnTo: string };
};
