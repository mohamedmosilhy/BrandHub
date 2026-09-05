import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Ticket, TicketInput, TicketMessage } from './entities';

/**
 * Support is on the **real contract** (D19): `/support/tickets` with its messages exists in the
 * collection, so this port is implemented by `HttpSupportRepository` from the start rather than by
 * a mock. What the collection does not carry is a response example, so the field set is the mock's
 * — see `INVENTED_ENDPOINTS.md`.
 */
export interface SupportRepository {
  list(
    page?: number,
    size?: number,
  ): Promise<Result<readonly Ticket[], AppError>>;
  getById(id: string): Promise<Result<Ticket, AppError>>;
  create(input: TicketInput): Promise<Result<Ticket, AppError>>;
  reply(
    ticketId: string,
    message: string,
  ): Promise<Result<TicketMessage, AppError>>;
}
