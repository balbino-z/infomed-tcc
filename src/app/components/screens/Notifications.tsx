import { useEffect, useState } from 'react';
import { Calendar, Pill, MapPin, AlertCircle, type LucideIcon } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import type { AppNotification, NotificationType } from '../../domain/notification';
import { notificationRepository } from '../../repositories';
import { bus } from '../../features/notifications/NotificationBus';
import { timeAgo } from '../../features/scheduling/dateUtils';

interface NotificationsProps {
  navigate: (screen: Screen) => void;
}

const STYLE: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  appointment: { icon: Calendar, color: '#0A73FF' },
  medication: { icon: Pill, color: '#27C183' },
  posto: { icon: MapPin, color: '#FFCC48' },
  system: { icon: AlertCircle, color: '#8A94A6' },
};

export function Notifications({ navigate }: NotificationsProps) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () =>
    notificationRepository
      .list()
      .then(setItems)
      .catch(() => setError('Não foi possível carregar as notificações.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
    // Observer: se chegar notificação nova ou alguma for lida, a lista se atualiza sozinha
    return bus.on('notifications-changed', () => void load());
  }, []);

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Notificações" onBack={() => navigate('home')} showNotification={false} />

      <div className="px-6 py-4 flex items-center justify-between">
        <p className="text-[#64748B] text-sm">{unread} não {unread === 1 ? 'lida' : 'lidas'}</p>
        <button
          onClick={() => notificationRepository.markAllRead()}
          disabled={unread === 0}
          className="text-[#0A73FF] text-sm disabled:opacity-40"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {loading && <p className="text-[#64748B]">Carregando...</p>}
        {error && <p role="alert" className="text-[#FF4D5E]">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="text-[#64748B] text-center py-16">Nenhuma notificação por enquanto.</p>}

        <div className="space-y-3">
          {items.map((n) => {
            const { icon: Icon, color } = STYLE[n.type] ?? STYLE.system;
            const isUnread = !n.readAt;
            return (
              <button
                key={n.id}
                onClick={() => isUnread && notificationRepository.markRead(n.id)}
                className={`w-full text-left bg-white p-4 rounded-2xl border transition-all ${isUnread ? 'border-[#0A73FF] shadow-sm' : 'border-[#E8F1FF]'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[#1A2B48]">{n.title}</h4>
                      {isUnread && <div className="w-2 h-2 bg-[#0A73FF] rounded-full flex-shrink-0 mt-1.5" aria-label="não lida" />}
                    </div>
                    <p className="text-[#64748B] text-sm mb-2 leading-relaxed">{n.body}</p>
                    <p className="text-[#64748B] text-xs">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
