import { DomainError, NetworkError, type AppError } from '@core/errors';
import { Money } from '@core/money';
import { err, ok, type Result } from '@core/result';
import { IdempotencyAttempt, type IdempotencyKeyFactory } from '@core/types';

import { createEmail, createPhoneNumber } from '@domain/identity';

import {
  TOP_UP_MAXIMUM,
  TOP_UP_MINIMUM,
  type Gift,
  type GiftDeliveryMethod,
  type GiftDraft,
  type GiftInput,
  type PaymentStatus,
  type Wallet,
  type WalletCharge,
  type WalletTransaction,
} from './entities';
import type { WalletRepository } from './WalletRepository';

export const DEFAULT_PAGE_SIZE = 20;

function walletError(code: string, message: string) {
  return new DomainError({ code, message, correlationId: 'domain-wallet' });
}

/**
 * Parses what the customer typed into the amount field. The field is free text, so a stray comma,
 * a trailing space or an Arabic-Indic digit must not become `NaN` and reach the API as a charge.
 */
export function parseAmount(value: string): Result<Money, DomainError> {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[٫،,]/g, '.');
  if (!/^\d+(\.\d{1,3})?$/.test(normalized))
    return err(walletError('INVALID_AMOUNT', 'Enter an amount like 25.000'));
  return ok(Money.fromDecimal(normalized));
}

export class GetWalletUseCase {
  constructor(private readonly repository: WalletRepository) {}
  execute(): Promise<Result<Wallet, AppError>> {
    return this.repository.get();
  }
}

export class GetTransactionsUseCase {
  constructor(private readonly repository: WalletRepository) {}
  execute(
    page = 0,
    size = DEFAULT_PAGE_SIZE,
  ): Promise<Result<readonly WalletTransaction[], AppError>> {
    return this.repository.transactions(page, size);
  }
}

export class CheckPaymentStatusUseCase {
  constructor(private readonly repository: WalletRepository) {}
  execute(gatewayOrderId: string): Promise<Result<PaymentStatus, AppError>> {
    return this.repository.paymentStatus(gatewayOrderId);
  }
}

/**
 * Opens a hosted payment for a top-up.
 *
 * D20 — one customer intent gets one `Idempotency-Key`, and a retry after a lost response reuses
 * it, so a charge that the server created but never acknowledged is never created twice. The
 * attempt is keyed on the amount: changing the amount is a new intent and mints a new key.
 */
export class TopUpWalletUseCase {
  private attempt: { amount: number; value: IdempotencyAttempt } | null = null;

  constructor(
    private readonly repository: WalletRepository,
    private readonly keyFactory?: IdempotencyKeyFactory,
  ) {}

  async execute(amount: Money): Promise<Result<WalletCharge, AppError>> {
    // AC10.4 — the bounds are the domain's, so the screen cannot forget to apply them.
    if (amount.compare(TOP_UP_MINIMUM) < 0)
      return err(
        walletError(
          'AMOUNT_BELOW_MINIMUM',
          'The amount is below the top-up minimum.',
        ),
      );
    if (amount.compare(TOP_UP_MAXIMUM) > 0)
      return err(
        walletError(
          'AMOUNT_ABOVE_MAXIMUM',
          'The amount is above the top-up maximum.',
        ),
      );

    if (!this.attempt || this.attempt.amount !== amount.baisa) {
      this.attempt = {
        amount: amount.baisa,
        value: IdempotencyAttempt.start(this.keyFactory),
      };
    }
    const result = await this.repository.charge(amount, this.attempt.value.key);
    // A lost response may still have created the charge, so the key is retained for the retry.
    // Anything else — success or a definite failure — ends the attempt.
    if (result.ok || !(result.error instanceof NetworkError)) {
      this.attempt = null;
    }
    return result;
  }
}

/**
 * A recipient is an email address or an Omani mobile number, and which one it is decides the
 * contract's `deliveryMethod`. The rules are `@domain/identity`'s, not a second copy of the same
 * two regexes.
 */
export function resolveGiftRecipient(
  value: string,
): Result<
  { recipient: string; deliveryMethod: GiftDeliveryMethod },
  DomainError
> {
  const email = createEmail(value);
  if (email.ok) return ok({ recipient: email.value, deliveryMethod: 'EMAIL' });
  const phone = createPhoneNumber(value);
  if (phone.ok) return ok({ recipient: phone.value, deliveryMethod: 'SMS' });
  return err(
    walletError(
      'INVALID_RECIPIENT',
      'Enter the recipient as an email address or an Omani number.',
    ),
  );
}

export class SendGiftUseCase {
  constructor(private readonly repository: WalletRepository) {}

  /**
   * AC10.11 — a gift larger than the balance is blocked here rather than on screen, and the
   * balance is read back from the repository rather than trusted from the screen, so a stale
   * card cannot authorise a gift the wallet can no longer fund. The server refuses it too
   * (§28 S13); this is the message, not the control.
   */
  async execute(draft: GiftDraft): Promise<Result<Gift, AppError>> {
    const recipient = resolveGiftRecipient(draft.recipient);
    if (!recipient.ok) return recipient;
    const amount = parseAmount(draft.amount);
    if (!amount.ok) return amount;
    if (amount.value.baisa <= 0)
      return err(
        walletError('AMOUNT_REQUIRED', 'Enter an amount greater than zero.'),
      );

    const wallet = await this.repository.get();
    if (!wallet.ok) return wallet;
    if (wallet.value.balance.compare(amount.value) < 0)
      return err(
        walletError(
          'INSUFFICIENT_BALANCE',
          'The gift is larger than the wallet balance.',
        ),
      );

    const input: GiftInput = {
      recipient: recipient.value.recipient,
      amount: amount.value,
      currency: 'OMR',
      occasion: draft.occasion,
      message: draft.message.trim(),
      deliveryMethod: recipient.value.deliveryMethod,
      // v1 always sends in the customer's own name and never schedules; both fields are in the
      // contract and the prototype offers neither control, so they are stated, not omitted.
      senderMode: 'NAMED',
      scheduledAt: null,
    };
    return this.repository.sendGift(input);
  }
}

export class GetSentGiftsUseCase {
  constructor(private readonly repository: WalletRepository) {}
  execute(): Promise<Result<readonly Gift[], AppError>> {
    return this.repository.sentGifts();
  }
}
