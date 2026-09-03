import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { NetworkError, ServerError, type AppError } from '@core/errors';

import type { Logger } from '@infrastructure/logging';

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof NetworkError) return failureCount < 2;
  if (error instanceof ServerError) return failureCount < 1;
  return false;
}

export function createAppQueryClient(logger: Logger): QueryClient {
  const logError = (error: unknown) => {
    const appError = error as AppError;
    logger.error('Server-state operation failed', {
      error: appError,
      correlationId: appError?.correlationId,
    });
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: logError }),
    mutationCache: new MutationCache({ onError: logError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
      },
      mutations: { retry: false },
    },
  });
}
