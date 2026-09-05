import { Money } from '@core/money';

/**
 * Every kind of row the wallet history can show. `UNKNOWN` keeps a type the app has not met from
 * erasing a movement of the customer's own money — it renders as a debit-styled neutral row,
 * which is the safe reading of an unrecognised entry.
 */
export type TransactionType =
  | 'CREDIT'
  | 'REFUND'
  | 'GIFT_RECEIVED'
  | 'TRANSFER_IN'
  | 'PURCHASE'
  | 'GIFT_SENT'
  | 'TRANSFER_OUT'
  | 'UNKNOWN';

const CREDITS = new Set<TransactionType>([
  'CREDIT',
  'REFUND',
  'GIFT_RECEIVED',
  'TRANSFER_IN',
]);

/** `+1` for money arriving, `-1` for money leaving. The row's sign and tint both read this. */
export function transactionSign(type: TransactionType): 1 | -1 {
  return CREDITS.has(type) ? 1 : -1;
}

export function isCredit(type: TransactionType): boolean {
  return transactionSign(type) === 1;
}

export type Wallet = Readonly<{ balance: Money; currency: 'OMR' }>;

export type WalletTransaction = Readonly<{
  id: string;
  type: TransactionType;
  amount: Money;
  description: string;
  createdAt: string;
}>;

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'UNKNOWN';

/**
 * A hosted-payment charge. `paymentUrl` is the page the customer is sent to — **card details are
 * never typed inside the app** (§28) — and `gatewayOrderId` is the key
 * `GET /payments/PAYMOB/status` answers about, so the result screen can resolve a pending charge
 * rather than guessing.
 */
export type WalletCharge = Readonly<{
  id: string;
  amount: Money;
  status: PaymentStatus;
  paymentUrl: string;
  referenceId: string;
  gatewayOrderId: string;
}>;

/**
 * Top-up bounds. The contract exposes limits for wallet **transfers** and none for top-up, so
 * these match the transfer settings the API already publishes rather than inventing a second
 * scale. Recorded for the backend in `INVENTED_ENDPOINTS.md`.
 */
export const TOP_UP_MINIMUM = Money.fromDecimal(1);
export const TOP_UP_MAXIMUM = Money.fromDecimal(500);

/** The prototype's four occasion chips, in its order. */
export type GiftOccasion = 'BIRTHDAY' | 'EID' | 'GRADUATION' | 'THANK_YOU';

export const GIFT_OCCASIONS: readonly GiftOccasion[] = [
  'BIRTHDAY',
  'EID',
  'GRADUATION',
  'THANK_YOU',
];

/** The contract's two enums. A recipient's form decides which delivery method the payload names. */
export type GiftDeliveryMethod = 'EMAIL' | 'SMS';
export type GiftSenderMode = 'NAMED' | 'ANONYMOUS';

export type GiftStatus =
  'SENT' | 'SCHEDULED' | 'CLAIMED' | 'CANCELLED' | 'UNKNOWN';

export type Gift = Readonly<{
  id: string;
  recipient: string;
  amount: Money;
  occasion: string;
  message: string;
  status: GiftStatus;
  createdAt: string;
}>;

/** Exactly what the gifts form collects, before validation. */
export type GiftDraft = Readonly<{
  recipient: string;
  amount: string;
  occasion: GiftOccasion;
  message: string;
}>;

/** A validated draft. Only `SendGiftUseCase` produces one; only the port consumes it. */
export type GiftInput = Readonly<{
  recipient: string;
  amount: Money;
  currency: 'OMR';
  occasion: GiftOccasion;
  message: string;
  deliveryMethod: GiftDeliveryMethod;
  senderMode: GiftSenderMode;
  scheduledAt: string | null;
}>;
