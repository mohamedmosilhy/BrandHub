import {
  ContractError,
  NetworkError,
  ServerError,
  ValidationError,
} from '@core/errors';

import { shouldRetry } from './queryClient';

const options = {
  code: 'TEST',
  message: 'test',
  correlationId: 'cor-test',
};

describe('query retry policy', () => {
  it('retries network errors twice and server errors once', () => {
    expect(shouldRetry(0, new NetworkError(options))).toBe(true);
    expect(shouldRetry(1, new NetworkError(options))).toBe(true);
    expect(shouldRetry(2, new NetworkError(options))).toBe(false);
    expect(shouldRetry(0, new ServerError(500, options))).toBe(true);
    expect(shouldRetry(1, new ServerError(500, options))).toBe(false);
  });

  it('does not retry validation or contract errors', () => {
    expect(shouldRetry(0, new ValidationError(400, options))).toBe(false);
    expect(shouldRetry(0, new ContractError(options))).toBe(false);
  });
});
