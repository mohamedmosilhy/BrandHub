export type SuccessEnvelope<T> = Readonly<{ success: true; data: T }>;

export function envelope<T>(data: T): SuccessEnvelope<T> {
  return { success: true, data };
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
) {
  return {
    status,
    error: code,
    message,
    timestamp: new Date().toISOString(),
    ...(details ? { details } : {}),
  };
}
