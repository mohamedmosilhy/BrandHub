import { Money } from '@core/money';

import type {
  Gift,
  GiftStatus,
  PaymentStatus,
  TransactionType,
  Wallet,
  WalletCharge,
  WalletTransaction,
} from '@domain/wallet';

import type {
  GiftDto,
  WalletChargeDto,
  WalletDto,
  WalletTransactionDto,
} from '@data/wallet/dto';

const types = new Set<TransactionType>([
  'CREDIT',
  'REFUND',
  'GIFT_RECEIVED',
  'TRANSFER_IN',
  'PURCHASE',
  'GIFT_SENT',
  'TRANSFER_OUT',
]);

const giftStatuses = new Set<GiftStatus>([
  'SENT',
  'SCHEDULED',
  'CLAIMED',
  'CANCELLED',
]);

/** `PAID` and `SUCCESS` both mean settled; gateways are not consistent about which they send. */
export function mapPaymentStatus(value: string): PaymentStatus {
  const status = value.toUpperCase();
  if (status === 'PAID' || status === 'SUCCESS') return 'PAID';
  if (status === 'FAILED' || status === 'FAILURE' || status === 'DECLINED')
    return 'FAILED';
  return status === 'PENDING' ? 'PENDING' : 'UNKNOWN';
}

export function mapWallet(dto: WalletDto): Wallet {
  return { balance: Money.fromDecimal(dto.balance), currency: dto.currency };
}

export function mapWalletTransaction(
  dto: WalletTransactionDto,
): WalletTransaction {
  return {
    id: dto.id,
    type: types.has(dto.type as TransactionType)
      ? (dto.type as TransactionType)
      : 'UNKNOWN',
    // The API reports a magnitude; the sign is the type's, so a server that ever sent a negative
    // amount for a debit cannot make the row read as a double negative.
    amount: Money.fromDecimal(Math.abs(dto.amount)),
    description: dto.description,
    createdAt: dto.createdAt,
  };
}

export function mapWalletCharge(dto: WalletChargeDto): WalletCharge {
  return {
    id: dto.id,
    amount: Money.fromDecimal(dto.amount),
    status: mapPaymentStatus(dto.status),
    paymentUrl: dto.paymentUrl,
    referenceId: dto.referenceId,
    gatewayOrderId: dto.gatewayOrderId,
  };
}

export function mapGift(dto: GiftDto): Gift {
  return {
    id: dto.id,
    recipient: dto.recipient,
    amount: Money.fromDecimal(dto.amount),
    occasion: dto.occasion,
    message: dto.message,
    status: giftStatuses.has(dto.status as GiftStatus)
      ? (dto.status as GiftStatus)
      : 'UNKNOWN',
    createdAt: dto.createdAt,
  };
}
