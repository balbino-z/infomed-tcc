import type { AppNotification } from '../domain/notification';

export interface NotificationRepository {
  list(): Promise<AppNotification[]>;
  countUnread(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
