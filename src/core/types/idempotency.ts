export type IdempotencyKey = string & { readonly __brand: 'IdempotencyKey' };
export type IdempotencyKeyFactory = () => IdempotencyKey;

export function createIdempotencyKey(): IdempotencyKey {
  const random = Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${random}` as IdempotencyKey;
}

/** One instance represents one user intent; retries reuse its immutable key. */
export class IdempotencyAttempt {
  readonly key: IdempotencyKey;

  private constructor(key: IdempotencyKey) {
    this.key = key;
    Object.freeze(this);
  }

  static start(
    factory: IdempotencyKeyFactory = createIdempotencyKey,
  ): IdempotencyAttempt {
    return new IdempotencyAttempt(factory());
  }
}
