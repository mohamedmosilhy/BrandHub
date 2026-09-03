export type LocalisedText = Readonly<{ ar: string; en: string }>;

export type MockDatabase = {
  users: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  products: Record<string, unknown>[];
  influencers: Record<string, unknown>[];
  posts: Record<string, unknown>[];
  follows: Record<string, unknown>[];
  cartItems: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  addresses: Record<string, unknown>[];
  tickets: Record<string, unknown>[];
  ticketAttachments: Record<string, unknown>[];
  walletTransactions: Record<string, unknown>[];
  walletTransfers: Record<string, unknown>[];
  gifts: Record<string, unknown>[];
  returns: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  coupons: Record<string, unknown>[];
  areas: Record<string, unknown>[];
  shippingRates: Record<string, unknown>[];
  wishlist: Record<string, unknown>[];
  refreshTokens: Record<string, unknown>[];
  revokedTokens: Record<string, unknown>[];
  idempotency: Record<string, unknown>[];
  otpChallenges: Record<string, unknown>[];
};
