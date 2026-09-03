import type { IdempotencyKey } from './idempotency';
import { IdempotencyAttempt } from './idempotency';

describe('IdempotencyAttempt', () => {
  it('reuses a key for retries and mints a new key for a fresh attempt', () => {
    let sequence = 0;
    const factory = () => `attempt-${++sequence}` as IdempotencyKey;

    const firstAttempt = IdempotencyAttempt.start(factory);
    const retryKeys = [firstAttempt.key, firstAttempt.key, firstAttempt.key];
    const freshAttempt = IdempotencyAttempt.start(factory);

    expect(new Set(retryKeys)).toEqual(new Set(['attempt-1']));
    expect(freshAttempt.key).toBe('attempt-2');
  });
});
