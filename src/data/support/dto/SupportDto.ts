import { z } from 'zod';

/**
 * `/support/tickets` is contracted (D19) but the collection carries no response example, so the
 * field set below is the mock's — recorded in `INVENTED_ENDPOINTS.md` under the routes the backend
 * already owns. `category`, `priority`, `status` and `senderType` are plain strings rather than
 * enums on purpose: a value the app has not met must narrow in the mapper, not reject a whole page
 * of tickets the customer is waiting on.
 */
export const ticketMessageDtoSchema = z.object({
  id: z.string().min(1),
  senderType: z.string().min(1),
  message: z.string(),
  createdAt: z.string().min(1),
});

export const ticketDtoSchema = z.object({
  id: z.string().min(1),
  ticketNumber: z.string().min(1),
  userId: z.string().min(1),
  orderId: z.string().min(1).nullable(),
  category: z.string().min(1),
  priority: z.string().min(1),
  subject: z.string().min(1),
  description: z.string(),
  status: z.string().min(1),
  messages: z.array(ticketMessageDtoSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const ticketPageDtoSchema = z.object({
  content: z.array(ticketDtoSchema),
  number: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type TicketDto = z.infer<typeof ticketDtoSchema>;
export type TicketMessageDto = z.infer<typeof ticketMessageDtoSchema>;
