import { isAxiosError, type AxiosError } from 'axios';

import {
  AppError,
  ConflictError,
  ForbiddenError,
  HttpError,
  NetworkError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
} from '@core/errors';

import { createCorrelationId, type CorrelationIdFactory } from './correlation';

type ErrorPayload = Readonly<{
  code?: string;
  error?: string;
  message?: string;
  details?: Readonly<Record<string, unknown>>;
}>;

function responseCorrelationId(error: AxiosError): string | undefined {
  const responseHeader = error.response?.headers['x-correlation-id'];
  if (typeof responseHeader === 'string') return responseHeader;
  const requestHeader = error.config?.headers?.get?.('X-Correlation-ID');
  return typeof requestHeader === 'string' ? requestHeader : undefined;
}

function payloadOf(error: AxiosError): ErrorPayload {
  return error.response?.data && typeof error.response.data === 'object'
    ? (error.response.data as ErrorPayload)
    : {};
}

export function normalizeHttpError(
  source: unknown,
  correlationIdFactory: CorrelationIdFactory = createCorrelationId,
): AppError {
  if (source instanceof AppError) return source;
  if (!isAxiosError(source)) {
    return new UnknownError({
      code: 'UNKNOWN',
      message:
        source instanceof Error ? source.message : 'An unknown error occurred',
      correlationId: correlationIdFactory(),
      cause: source,
    });
  }

  const correlationId = responseCorrelationId(source) ?? correlationIdFactory();
  if (!source.response) {
    const timedOut =
      source.code === 'ECONNABORTED' || source.code === 'ETIMEDOUT';
    return new NetworkError({
      code: timedOut ? 'NETWORK_TIMEOUT' : 'NETWORK_UNAVAILABLE',
      message: timedOut
        ? 'The request timed out'
        : 'The network request failed',
      correlationId,
      cause: source,
    });
  }

  const status = source.response.status;
  const payload = payloadOf(source);
  const options = {
    code: payload.code ?? payload.error ?? `HTTP_${status}`,
    message: payload.message ?? source.message,
    correlationId,
    ...(payload.details ? { details: payload.details } : {}),
    cause: source,
  };

  if (status === 400 || status === 422)
    return new ValidationError(status, options);
  if (status === 401) return new UnauthorizedError(options);
  if (status === 403) return new ForbiddenError(options);
  if (status === 404) return new NotFoundError(options);
  if (status === 409) return new ConflictError(options);
  if (status >= 500) return new ServerError(status, options);
  return new HttpError(status, options);
}
