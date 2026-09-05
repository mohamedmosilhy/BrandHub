import { z } from 'zod';

/**
 * `GET /notifications?isRead=&page=&size=` is in the collection, but it carries no response
 * example, so the field set below is the mock's — listed in `INVENTED_ENDPOINTS.md` under the
 * routes the backend owns and only the shape is at stake. `type` is deliberately a plain string:
 * a kind the app has not met yet must still render, so the mapper narrows it rather than the
 * schema rejecting the whole page.
 */
export const notificationDtoSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  isRead: z.boolean(),
  createdAt: z.string().min(1),
});

export const notificationPageDtoSchema = z.object({
  content: z.array(notificationDtoSchema),
  number: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

/** Invented (FA1): the response to `POST /notifications/read-all`. */
export const markAllReadDtoSchema = z.object({
  updated: z.number().int().nonnegative(),
});

export type NotificationDto = z.infer<typeof notificationDtoSchema>;
