import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  ConflictError,
  ForbiddenError,
  HttpError,
  NetworkError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from '@core/errors';

import { normalizeHttpError } from './errors';

function axiosFailure(status: number): AxiosError {
  const config = {
    headers: new AxiosHeaders({ 'X-Correlation-ID': 'cor-request' }),
  } as InternalAxiosRequestConfig;
  const response: AxiosResponse = {
    data: { code: `ERROR_${status}`, message: `Status ${status}` },
    status,
    statusText: 'Failure',
    headers: new AxiosHeaders(),
    config,
  };
  return new AxiosError(
    `Status ${status}`,
    'ERR_BAD_RESPONSE',
    config,
    undefined,
    response,
  );
}

describe('HTTP error normalization', () => {
  it.each([
    [400, ValidationError],
    [401, UnauthorizedError],
    [403, ForbiddenError],
    [404, NotFoundError],
    [409, ConflictError],
    [422, ValidationError],
    [500, ServerError],
    [503, ServerError],
    [418, HttpError],
  ])('maps status %s to %s', (status, ErrorType) => {
    const normalized = normalizeHttpError(
      axiosFailure(status),
      () => 'fallback',
    );
    expect(normalized).toBeInstanceOf(ErrorType);
    expect(normalized).toMatchObject({
      code: `ERROR_${status}`,
      correlationId: 'cor-request',
    });
  });

  it.each([
    ['ERR_NETWORK', 'NETWORK_UNAVAILABLE'],
    ['ECONNABORTED', 'NETWORK_TIMEOUT'],
    ['ETIMEDOUT', 'NETWORK_TIMEOUT'],
  ])('maps %s to NetworkError', (axiosCode, expectedCode) => {
    const error = new AxiosError('failed', axiosCode, {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig);
    expect(normalizeHttpError(error, () => 'cor-network')).toMatchObject({
      code: expectedCode,
      correlationId: 'cor-network',
    });
    expect(normalizeHttpError(error)).toBeInstanceOf(NetworkError);
  });
});
