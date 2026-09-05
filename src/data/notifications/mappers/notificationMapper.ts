import type { AppNotification, NotificationKind } from '@domain/notifications';

import type { NotificationDto } from '@data/notifications/dto';

const kinds = new Set<NotificationKind>([
  'ORDER',
  'DELIVERY',
  'PROMOTION',
  'SOCIAL',
  'PRICE_DROP',
]);

export function mapNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    // An unrecognised kind still renders — as a neutral row — rather than dropping an update the
    // customer is waiting on.
    kind: kinds.has(dto.type as NotificationKind)
      ? (dto.type as NotificationKind)
      : 'UNKNOWN',
    title: dto.title,
    body: dto.body,
    read: dto.isRead,
    createdAt: dto.createdAt,
  };
}
