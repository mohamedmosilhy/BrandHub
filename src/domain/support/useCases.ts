import { DomainError, type AppError } from '@core/errors';
import { err, type Result } from '@core/result';

import {
  ticketDraftErrors,
  type Ticket,
  type TicketDraft,
  type TicketMessage,
} from './entities';
import type { SupportRepository } from './SupportRepository';

export const DEFAULT_PAGE_SIZE = 20;

function supportError(
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
) {
  return new DomainError({
    code,
    message,
    correlationId: 'domain-support',
    ...(details ? { details } : {}),
  });
}

export class GetTicketsUseCase {
  constructor(private readonly repository: SupportRepository) {}
  execute(
    page = 0,
    size = DEFAULT_PAGE_SIZE,
  ): Promise<Result<readonly Ticket[], AppError>> {
    return this.repository.list(page, size);
  }
}

export class GetTicketUseCase {
  constructor(private readonly repository: SupportRepository) {}
  execute(id: string): Promise<Result<Ticket, AppError>> {
    return this.repository.getById(id);
  }
}

export class CreateTicketUseCase {
  constructor(private readonly repository: SupportRepository) {}

  /**
   * AC12.3 — both required fields are checked together and reported together, so a customer who
   * left both blank is told so once rather than being sent round the form twice. The failing
   * field names travel in `details.fields`; the screen turns them into copy.
   */
  async execute(draft: TicketDraft): Promise<Result<Ticket, AppError>> {
    const missing = ticketDraftErrors(draft);
    if (missing.length > 0)
      return err(
        supportError(
          'TICKET_INCOMPLETE',
          'The subject and the description are both required.',
          { fields: missing },
        ),
      );
    return this.repository.create({
      ...draft,
      subject: draft.subject.trim(),
      description: draft.description.trim(),
    });
  }
}

export class ReplyToTicketUseCase {
  constructor(private readonly repository: SupportRepository) {}

  /** AC12.9 — an empty reply never leaves the device; whitespace is not a message. */
  async execute(
    ticketId: string,
    message: string,
  ): Promise<Result<TicketMessage, AppError>> {
    const body = message.trim();
    if (!body)
      return err(supportError('REPLY_REQUIRED', 'Write a reply first.'));
    return this.repository.reply(ticketId, body);
  }
}
