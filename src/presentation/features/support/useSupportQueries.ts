import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import {
  ticketThread,
  type CreateTicketUseCase,
  type GetTicketUseCase,
  type GetTicketsUseCase,
  type ReplyToTicketUseCase,
  type Ticket,
  type TicketDraft,
} from '@domain/support';

/**
 * Ticket content is the customer's own words plus support's reply, and the mock resolves its
 * seeded copy from `Accept-Language` like everything else, so the keys are locale-scoped (D9).
 */
export const supportKeys = {
  tickets: (locale: string) => ['support', 'tickets', locale] as const,
  ticket: (locale: string, id: string) =>
    ['support', 'ticket', locale, id] as const,
};

async function valueOf<T>(operation: Promise<Result<T, AppError>>) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

export function useTickets(useCase: GetTicketsUseCase, locale: string) {
  return useQuery({
    queryKey: supportKeys.tickets(locale),
    queryFn: () => valueOf(useCase.execute()),
  });
}

export function useTicket(
  useCase: GetTicketUseCase,
  locale: string,
  id: string,
) {
  return useQuery({
    queryKey: supportKeys.ticket(locale, id),
    queryFn: () => valueOf(useCase.execute(id)),
  });
}

/**
 * Creating is not optimistic. The server mints the ticket number and the status the list renders,
 * so an optimistic row would show a placeholder number the customer might quote back to support.
 * The created ticket is written straight into the list cache instead, which puts it at the top
 * (AC12.4) without waiting for the refetch that follows.
 */
export function useCreateTicket({
  createTicket,
  locale,
}: {
  createTicket: CreateTicketUseCase;
  locale: string;
}) {
  const client = useQueryClient();
  const key = supportKeys.tickets(locale);
  return useMutation({
    mutationFn: (draft: TicketDraft) => valueOf(createTicket.execute(draft)),
    onSuccess: (ticket) => {
      client.setQueryData<readonly Ticket[]>(key, (current) => [
        ticket,
        ...(current ?? []),
      ]);
      void client.invalidateQueries({ queryKey: key });
      // The account hub shows a live ticket count beside its support row.
      void client.invalidateQueries({ queryKey: ['account-metrics'] });
    },
  });
}

/**
 * Replying appends to the open thread's cache as soon as the server confirms it, so the bubble
 * appears without a refetch, and invalidates the list because the reply moved the ticket's
 * `updatedAt` — which is what the list's meta line shows.
 */
export function useReplyToTicket({
  replyToTicket,
  locale,
  ticketId,
}: {
  replyToTicket: ReplyToTicketUseCase;
  locale: string;
  ticketId: string;
}) {
  const client = useQueryClient();
  const key = supportKeys.ticket(locale, ticketId);
  return useMutation({
    mutationFn: (message: string) =>
      valueOf(replyToTicket.execute(ticketId, message)),
    onSuccess: (message) => {
      client.setQueryData<Ticket>(key, (current) =>
        current
          ? {
              ...current,
              // `ticketThread` first, so a ticket whose opening complaint the server kept only in
              // `description` does not lose it the moment a reply is appended.
              messages: [...ticketThread(current), message],
              updatedAt: message.createdAt,
            }
          : current,
      );
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({
        queryKey: supportKeys.tickets(locale),
      });
    },
  });
}
