export type ErrorDetails = Readonly<Record<string, unknown>>;

export type AppErrorOptions = Readonly<{
  code: string;
  message: string;
  correlationId: string;
  details?: ErrorDetails;
  cause?: unknown;
}>;

export class AppError extends Error {
  readonly code: string;
  readonly correlationId: string;
  readonly details: ErrorDetails | undefined;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.correlationId = options.correlationId;
    this.details = options.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends AppError {}

export class HttpError extends AppError {
  readonly status: number;

  constructor(status: number, options: AppErrorOptions) {
    super(options);
    this.status = status;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(options: AppErrorOptions) {
    super(401, options);
  }
}

export class ForbiddenError extends HttpError {
  constructor(options: AppErrorOptions) {
    super(403, options);
  }
}

export class NotFoundError extends HttpError {
  constructor(options: AppErrorOptions) {
    super(404, options);
  }
}

export class ValidationError extends HttpError {
  // Narrows the only two validation statuses even though the implementation delegates.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(status: 400 | 422, options: AppErrorOptions) {
    super(status, options);
  }
}

export class ConflictError extends HttpError {
  constructor(options: AppErrorOptions) {
    super(409, options);
  }
}

export class ServerError extends HttpError {}
export class ContractError extends AppError {}
export class DomainError extends AppError {}
export class UnknownError extends AppError {}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
