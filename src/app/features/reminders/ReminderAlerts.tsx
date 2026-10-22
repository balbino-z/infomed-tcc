import { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import { bus, type DueReminder } from '../notifications/NotificationBus';
import { ReminderScheduler } from './ReminderScheduler';
import { reminderRepository } from '../../repositories';
import { useAuth } from '../auth/AuthContext';

/** Liga o agendador (quando há usuário logado) e mostra o aviso "Hora do remédio" na tela. */
export function ReminderAlerts() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<DueReminder[]>([]);

  useEffect(() => {
    if (!user) return;
    const scheduler = new ReminderScheduler(() => reminderRepository.list());
    void scheduler.start();
    const off = bus.on('reminder-due', (d) => setQueue((q) => [...q, d]));
    return () => {
      scheduler.stop();
      off();
    };
  }, [user?.id]);

  const current = queue[0];
  if (!current) return null;

  const close = () => setQueue((q) => q.slice(1));
  const snooze = () => {
    const d = current;
    close();
    setTimeout(() => bus.emit('reminder-due', d), 10 * 60_000);
  };

  return (
    <div role="alert" className="absolute top-3 left-3 right-3 z-[2000] bg-white rounded-2xl shadow-xl border border-[#FFCC48] p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 bg-[#27C183]/10 rounded-xl flex items-center justify-center">
          <Pill className="w-5 h-5 text-[#27C183]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#1A2B48]">Hora do remédio</p>
          <p className="text-[#64748B] text-sm">
            {current.label} · {current.time}
            {current.note ? ` · ${current.note}` : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={close} className="flex-1 h-10 bg-[#0A73FF] text-white rounded-xl">Ok, entendi</button>
        <button onClick={snooze} className="flex-1 h-10 bg-[#F7FAFF] text-[#0A73FF] rounded-xl">Adiar 10 min</button>
      </div>
    </div>
  );
}
