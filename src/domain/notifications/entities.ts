/**
 * The five kinds the prototype's list draws, each with its own icon token and tint. `UNKNOWN`
 * carries a kind the app does not recognise: a new server kind must render as a plain row, not
 * disappear from a list the customer is relying on.
 */
export type NotificationKind =
  'ORDER' | 'DELIVERY' | 'PROMOTION' | 'SOCIAL' | 'PRICE_DROP' | 'UNKNOWN';

export type AppNotification = Readonly<{
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}>;

export function unreadCount(notifications: readonly AppNotification[]): number {
  return notifications.filter((notification) => !notification.read).length;
}
