import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import {
  DEFAULT_PAGE_SIZE,
  type GetSentGiftsUseCase,
  type GetTransactionsUseCase,
  type GetWalletUseCase,
} from '@domain/wallet';

/**
 * The wallet balance is money the customer can see change, so its key is deliberately **not**
 * locale-scoped — a language switch must not look like a balance refetch. Transaction
 * descriptions are server-localised, so those are.
 */
export const walletKeys = {
  balance: () => ['wallet', 'balance'] as const,
  transactions: (locale: string) => ['wallet', 'transactions', locale] as const,
  gifts: () => ['wallet', 'gifts', 'sent'] as const,
};

async function valueOf<T>(operation: Promise<Result<T, AppError>>) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

export function useWallet(useCase: GetWalletUseCase) {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => valueOf(useCase.execute()),
  });
}

export function useWalletTransactions(
  useCase: GetTransactionsUseCase,
  locale: string,
) {
  return useInfiniteQuery({
    queryKey: walletKeys.transactions(locale),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => valueOf(useCase.execute(pageParam)),
    // A short page is the last page — the same rule the orders list uses, and it behaves
    // correctly when a top-up adds a row mid-scroll.
    getNextPageParam: (last, pages) =>
      last.length < DEFAULT_PAGE_SIZE ? undefined : pages.length,
  });
}

export function useSentGifts(useCase: GetSentGiftsUseCase) {
  return useQuery({
    queryKey: walletKeys.gifts(),
    queryFn: () => valueOf(useCase.execute()),
  });
}

/**
 * AC10.9 — after a settled payment the balance and the history are both stale, and the wallet has
 * to show the new figures without the customer pulling to refresh. One hook, so no screen can
 * refresh half of it.
 */
export function useRefreshWallet() {
  const client = useQueryClient();
  return useCallback(async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: walletKeys.balance() }),
      client.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
      client.invalidateQueries({ queryKey: ['account-metrics'] }),
    ]);
  }, [client]);
}
