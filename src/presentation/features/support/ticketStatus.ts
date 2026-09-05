import type { TicketStatus } from '@domain/support';

import type { BadgeTone } from '@presentation/components/surfaces';

export const TICKET_STATUS_KEY: Record<TicketStatus, string> = {
  OPEN: 'ticketStatus_OPEN',
  IN_PROGRESS: 'ticketStatus_IN_PROGRESS',
  RESOLVED: 'ticketStatus_RESOLVED',
  CLOSED: 'ticketStatus_CLOSED',
  UNKNOWN: 'ticketStatus_UNKNOWN',
};

/**
 * The prototype paints its three ticket states pink, amber and green — `#FCEEF3/#D4537E`,
 * `#FEF7E0/#B98900`, `#E3F5EF/#2E9E7A`. Those are the badge tones `pink`, `warning` and `success`
 * at the theme's accessible foregrounds. The contract's three statuses take those three slots;
 * a closed or unrecognised ticket is neutral, because neither is a state the prototype tints.
 */
export function statusTone(status: TicketStatus): BadgeTone {
  switch (status) {
    case 'OPEN':
      return 'pink';
    case 'IN_PROGRESS':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    case 'CLOSED':
    case 'UNKNOWN':
      return 'neutral';
  }
}
