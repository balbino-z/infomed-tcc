import { useEffect, useState } from 'react';
import { Bell, Clock, Plus, Trash2 } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { BottomNav } from '../shared/BottomNav';
import type { Reminder } from '../../domain/reminder';
import { describeDays } from '../../domain/reminder';
import { reminderRepository } from '../../repositories';
import { bus } from '../../features/notifications/NotificationBus';

interface RemindersListProps {
  navigate: (screen: Screen, data?: any) => void;
}

export function RemindersList({ navigate }: RemindersListProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  const load = () =>
    reminderRepository
      .list()
      .then(setReminders)
      .catch(() => setError('Não foi possível carregar os lembretes.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
    return bus.on('reminders-changed', () => void load());
  }, []);

  const enableDeviceAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    setPermission(await Notification.requestPermission());
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Lembretes" onBack={() => navigate('home')} onNotification={() => navigate('notifications')} />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        {permission === 'default' && (
          <button onClick={enableDeviceAlerts} className="w-full mb-4 p-4 bg-[#0A73FF]/10 text-[#0A73FF] rounded-2xl text-left text-sm">
            🔔 Ativar avisos no aparelho. Eles funcionam com o app aberto.
          </button>
        )}

        {loading && <p className="text-[#64748B]">Carregando...</p>}
        {error && <p role="alert" className="text-[#FF4D5E]">{error}</p>}

        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r.id} className={`bg-white p-4 rounded-2xl border transition-all ${r.active ? 'border-[#E8F1FF]' : 'border-[#CED6E0]/30 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#1A2B48] mb-2">{r.label}</h4>
                  <div className="flex items-center gap-2 text-sm text-[#64748B] mb-2 flex-wrap">
                    <Clock className="w-4 h-4" />
                    <span className="text-[#1A2B48]">{r.times.join(' · ')}</span>
                    <span>•</span>
                    <span>{describeDays(r.daysOfWeek)}</span>
                  </div>
                  {r.note && <p className="text-[#64748B] text-sm">{r.note}</p>}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    role="switch"
                    aria-checked={r.active}
                    aria-label={`Lembrete ${r.label}`}
                    onClick={() => reminderRepository.setActive(r.id, !r.active)}
                    className={`w-12 h-7 rounded-full transition-all text-left ${r.active ? 'bg-[#27C183]' : 'bg-[#CED6E0]'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-all ${r.active ? 'ml-6' : 'ml-1'}`} />
                  </button>
                  <button
                    aria-label={`Excluir lembrete ${r.label}`}
                    onClick={() => reminderRepository.remove(r.id)}
                    className="w-8 h-8 flex items-center justify-center text-[#FF4D5E]"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && reminders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#F7FAFF] rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-[#CED6E0]" />
            </div>
            <p className="text-[#64748B] text-center mb-2">Nenhum lembrete configurado</p>
            <p className="text-[#64748B] text-sm text-center max-w-[250px]">Adicione lembretes para não esquecer de tomar seus medicamentos</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('create-reminder')}
        aria-label="Novo lembrete"
        className="absolute bottom-24 right-6 w-14 h-14 bg-[#0A73FF] text-white rounded-2xl shadow-lg hover:bg-[#005BEA] transition-all flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav active="reminders" onNavigate={navigate} />
    </div>
  );
}
