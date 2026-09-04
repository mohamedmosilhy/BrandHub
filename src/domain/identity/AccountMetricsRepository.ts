import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

/**
 * The counts the account hub's rows show beside their labels (AC9.2). Orders, addresses and
 * wishlist come from the repositories the screen already has; wallet, tickets and returns have no
 * other reason to be loaded there, so they are read together through one port rather than pulling
 * three feature slices into the hub.
 */
export type AccountMetrics = Readonly<{
  /** In OMR, already scaled from the API's decimal balance. */
  walletBalance: number;
  ticketCount: number;
  returnCount: number;
}>;

export interface AccountMetricsRepository {
  get(): Promise<Result<AccountMetrics, AppError>>;
}
