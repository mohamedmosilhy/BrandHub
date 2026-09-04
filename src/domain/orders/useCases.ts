import { DomainError, NetworkError, type AppError } from '@core/errors';
import { err, type Result } from '@core/result';
import { IdempotencyAttempt, type IdempotencyKeyFactory } from '@core/types';

import type { CartRepository } from '@domain/cart';
import type { CheckoutDraft } from '@domain/checkout';

import type { Order } from './entities';
import type { OrderRepository } from './OrderRepository';

function orderError(code: string, message: string) {
  return new DomainError({
    code,
    message,
    correlationId: 'domain-orders',
  });
}

export class PlaceOrderUseCase {
  private attempt: {
    fingerprint: string;
    draftFingerprint: string;
    retryPending: boolean;
    value: IdempotencyAttempt;
  } | null = null;

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly orderRepository: OrderRepository,
    private readonly keyFactory?: IdempotencyKeyFactory,
  ) {}

  async execute(draft: CheckoutDraft): Promise<Result<Order, AppError>> {
    if (!draft.shippingAddressId)
      return err(
        orderError('ADDRESS_REQUIRED', 'A shipping address is required.'),
      );
    if (!draft.paymentMethod)
      return err(
        orderError('PAYMENT_REQUIRED', 'A payment method is required.'),
      );

    const draftFingerprint = JSON.stringify({
      address: draft.shippingAddressId,
      payment: draft.paymentMethod,
      coupon: draft.coupon?.code ?? null,
    });
    // A response can be lost after the server has created the order and cleared its cart. In
    // that case validating/fingerprinting the now-empty server cart would prevent the only safe
    // retry. The retained user intent goes straight back out with the same key (D20).
    if (
      this.attempt?.retryPending &&
      this.attempt.draftFingerprint === draftFingerprint
    ) {
      const retry = await this.orderRepository.place(
        draft,
        this.attempt.value.key,
      );
      if (retry.ok || !(retry.error instanceof NetworkError)) {
        this.attempt = null;
      }
      return retry;
    }

    const cart = await this.cartRepository.get();
    if (!cart.ok) return cart;
    if (cart.value.lines.length === 0)
      return err(orderError('EMPTY_CART', 'The cart is empty.'));

    const fingerprint = JSON.stringify({
      draft: draftFingerprint,
      lines: cart.value.lines.map((line) => [line.id, line.quantity.value]),
    });
    if (!this.attempt || this.attempt.fingerprint !== fingerprint) {
      this.attempt = {
        fingerprint,
        draftFingerprint,
        retryPending: false,
        value: IdempotencyAttempt.start(this.keyFactory),
      };
    }
    const result = await this.orderRepository.place(
      draft,
      this.attempt.value.key,
    );
    if (!result.ok && result.error instanceof NetworkError) {
      this.attempt.retryPending = true;
    } else {
      this.attempt = null;
    }
    return result;
  }
}
