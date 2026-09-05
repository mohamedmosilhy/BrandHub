/**
 * The six categories the prototype's ticket form offers. Only `ORDER` appears in
 * `docs/ECommerce_API_Postman_Collection.json`; the other five are the client's proposal for the
 * same field and are recorded for the backend in `INVENTED_ENDPOINTS.md`.
 */
export type TicketCategory =
  'ORDER' | 'PAYMENT' | 'DELIVERY' | 'RETURN' | 'WALLET' | 'OTHER';

/** The contract's middle value is `NORMAL`, not `MEDIUM`; the prototype labels it "Medium". */
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH';

/**
 * `OPEN`, `IN_PROGRESS` and `RESOLVED` are the statuses the collection's admin routes set.
 * `CLOSED` is accepted because a support desk that resolves also closes, and `UNKNOWN` keeps a
 * status the app has not met from erasing a ticket the customer is waiting on.
 */
export type TicketStatus =
  'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'UNKNOWN';

export type TicketAuthor = 'CUSTOMER' | 'SUPPORT';

export type TicketMessage = Readonly<{
  id: string;
  author: TicketAuthor;
  body: string;
  createdAt: string;
}>;

export type Ticket = Readonly<{
  id: string;
  ticketNumber: string;
  orderId: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  messages: readonly TicketMessage[];
  createdAt: string;
  updatedAt: string;
}>;

/** Exactly what the ticket form collects, before validation. */
export type TicketDraft = Readonly<{
  category: TicketCategory;
  priority: TicketPriority;
  orderId: string | null;
  subject: string;
  description: string;
}>;

/** A validated draft. Only `CreateTicketUseCase` produces one; only the port consumes it. */
export type TicketInput = TicketDraft;

export const TICKET_CATEGORIES: readonly TicketCategory[] = [
  'ORDER',
  'PAYMENT',
  'DELIVERY',
  'RETURN',
  'WALLET',
  'OTHER',
];

export const TICKET_PRIORITIES: readonly TicketPriority[] = [
  'LOW',
  'NORMAL',
  'HIGH',
];

/** The two fields the form can block on. Both are checked at once, so both can be reported. */
export type TicketField = 'subject' | 'description';

export function ticketDraftErrors(draft: TicketDraft): readonly TicketField[] {
  const missing: TicketField[] = [];
  if (!draft.subject.trim()) missing.push('subject');
  if (!draft.description.trim()) missing.push('description');
  return missing;
}

/**
 * The thread the ticket screen renders.
 *
 * `POST /support/tickets` takes the opening complaint as `description` and starts the ticket with
 * an empty `messages` array, but the prototype's thread opens with exactly that text as the
 * customer's first bubble. A ticket that already carries messages is rendered as it stands — the
 * seeded and replied-to cases both do — so nothing is ever duplicated.
 */
export function ticketThread(ticket: Ticket): readonly TicketMessage[] {
  if (ticket.messages.length > 0) return ticket.messages;
  return [
    {
      id: `${ticket.id}-description`,
      author: 'CUSTOMER',
      body: ticket.description,
      createdAt: ticket.createdAt,
    },
  ];
}
