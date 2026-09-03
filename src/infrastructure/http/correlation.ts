let sequence = 0;

export type CorrelationIdFactory = () => string;

export function createCorrelationId(): string {
  sequence = (sequence + 1) % Number.MAX_SAFE_INTEGER;
  return `bh-${Date.now().toString(36)}-${sequence.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
