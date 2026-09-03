const REDACTED = '[REDACTED]';
export const REDACTED_FIELDS = Object.freeze([
  'password',
  'token',
  'authorization',
  'otp',
  'cardnumber',
  'iban',
]);

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSink = (
  level: LogLevel,
  message: string,
  context?: unknown,
) => void;

function sensitiveKey(key: string): boolean {
  const normalized = key.toLocaleLowerCase();
  return REDACTED_FIELDS.some((field) => normalized.includes(field));
}

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[^\s,;]+/gi, `Bearer ${REDACTED}`)
    .replace(
      /(password|token|authorization|otp|cardNumber|iban)\s*[:=]\s*[^\s,;]+/gi,
      (_match, field: string) => `${field}=${REDACTED}`,
    );
}

export function redact(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sensitiveKey(key) ? REDACTED : redact(item),
    ]),
  );
}

const consoleSink: LogSink = (level, message, context) => {
  const args = context === undefined ? [message] : [message, context];
  if (level === 'error') console.error(...args);
  else if (level === 'warn') console.warn(...args);
  else if (level === 'info') console.info(...args);
  else console.debug(...args);
};

export class Logger {
  constructor(
    private readonly sink: LogSink = consoleSink,
    private readonly verbose = __DEV__,
  ) {}

  debug(message: string, context?: unknown): void {
    if (this.verbose) this.write('debug', message, context);
  }

  info(message: string, context?: unknown): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: unknown): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: unknown): void {
    this.write('error', message, context);
  }

  private write(level: LogLevel, message: string, context?: unknown): void {
    this.sink(level, redactString(message), redact(context));
  }
}
