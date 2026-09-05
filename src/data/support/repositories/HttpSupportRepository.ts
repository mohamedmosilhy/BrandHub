import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  DEFAULT_PAGE_SIZE,
  type SupportRepository,
  type TicketInput,
} from '@domain/support';

import type { SupportRemoteDataSource } from '@data/support/datasources';
import { mapTicket, mapTicketMessage } from '@data/support/mappers';

import { normalizeHttpError } from '@infrastructure/http';

/** HTTP from the start (D19): support tickets are on the real contract, not an invented one. */
export class HttpSupportRepository implements SupportRepository {
  constructor(private readonly remote: SupportRemoteDataSource) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async list(page = 0, size = DEFAULT_PAGE_SIZE) {
    try {
      const tickets = await this.remote.list(page, size);
      return ok(tickets.map(mapTicket));
    } catch (error) {
      return this.failure(error);
    }
  }

  async getById(id: string) {
    try {
      return ok(mapTicket(await this.remote.getById(id)));
    } catch (error) {
      return this.failure(error);
    }
  }

  async create(input: TicketInput) {
    try {
      return ok(mapTicket(await this.remote.create(input)));
    } catch (error) {
      return this.failure(error);
    }
  }

  async reply(ticketId: string, message: string) {
    try {
      return ok(mapTicketMessage(await this.remote.reply(ticketId, message)));
    } catch (error) {
      return this.failure(error);
    }
  }
}
