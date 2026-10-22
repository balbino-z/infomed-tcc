import type { AppNotification } from '../../domain/notification';
import type { NotificationRepository } from '../NotificationRepository';
import { emitNotificationsChanged } from '../../features/notifications/NotificationBus';

const now = Date.now();
const items: AppNotification[] = [
  { id: 'n1', type: 'appointment', title: 'Consulta agendada', body: 'Dra. Fernanda Rocha em 28/10/2026 às 10:00 - UBS Exemplo Centro', readAt: null, createdAt: new Date(now - 2 * 3600_000).toISOString() },
  { id: 'n2', type: 'system', title: 'Bem-vindo ao InfoMed', body: 'Consulte medicamentos, postos e agende consultas.', readAt: new Date(now - 24 * 3600_000).toISOString(), createdAt: new Date(now - 26 * 3600_000).toISOString() },
];

export class MockNotificationRepository implements NotificationRepository {
  async list() {
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async countUnread() {
    return items.filter((n) => !n.readAt).length;
  }
  async markRead(id: string) {
    const n = items.find((x) => x.id === id);
    if (n && !n.readAt) n.readAt = new Date().toISOString();
    emitNotificationsChanged();
  }
  async markAllRead() {
    items.forEach((n) => { if (!n.readAt) n.readAt = new Date().toISOString(); });
    emitNotificationsChanged();
  }
}
