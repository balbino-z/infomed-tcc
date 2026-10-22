import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppNotification, NotificationType } from '../../domain/notification';
import type { NotificationRepository } from '../NotificationRepository';
import { emitNotificationsChanged } from '../../features/notifications/NotificationBus';

interface Row { id: string; type: NotificationType; title: string; body: string; read_at: string | null; created_at: string }

const toDomain = (r: Row): AppNotification => ({ id: r.id, type: r.type, title: r.title, body: r.body, readAt: r.read_at, createdAt: r.created_at });

export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list() {
    const { data, error } = await this.db.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return (data as Row[]).map(toDomain);
  }

  async countUnread() {
    const { count, error } = await this.db.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
    if (error) throw error;
    return count ?? 0;
  }

  async markRead(id: string) {
    const { error } = await this.db.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
    if (error) throw error;
    emitNotificationsChanged();
  }

  async markAllRead() {
    const { error } = await this.db.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
    if (error) throw error;
    emitNotificationsChanged();
  }
}
