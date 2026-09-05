import type {
  Ticket,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from '@domain/support';

import type { TicketDto, TicketMessageDto } from '@data/support/dto';

const categories = new Set<TicketCategory>([
  'ORDER',
  'PAYMENT',
  'DELIVERY',
  'RETURN',
  'WALLET',
  'OTHER',
]);

const priorities = new Set<TicketPriority>(['LOW', 'NORMAL', 'HIGH']);

const statuses = new Set<TicketStatus>([
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]);

/**
 * Anyone who is not the customer is support. The collection has one customer message route and a
 * separate admin one, and the admin side may label its sender in more than one way (`ADMIN`,
 * `AGENT`, `SUPPORT`); the thread has two sides regardless, so the mapper decides by exclusion.
 */
export function mapTicketMessage(dto: TicketMessageDto): TicketMessage {
  return {
    id: dto.id,
    author:
      dto.senderType.toUpperCase() === 'CUSTOMER' ? 'CUSTOMER' : 'SUPPORT',
    body: dto.message,
    createdAt: dto.createdAt,
  };
}

export function mapTicket(dto: TicketDto): Ticket {
  return {
    id: dto.id,
    ticketNumber: dto.ticketNumber,
    orderId: dto.orderId,
    // An unrecognised category or priority falls back to the neutral end of each scale rather
    // than to a value that would overstate the ticket.
    category: categories.has(dto.category as TicketCategory)
      ? (dto.category as TicketCategory)
      : 'OTHER',
    priority: priorities.has(dto.priority as TicketPriority)
      ? (dto.priority as TicketPriority)
      : 'NORMAL',
    status: statuses.has(dto.status as TicketStatus)
      ? (dto.status as TicketStatus)
      : 'UNKNOWN',
    subject: dto.subject,
    description: dto.description,
    messages: dto.messages.map(mapTicketMessage),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
