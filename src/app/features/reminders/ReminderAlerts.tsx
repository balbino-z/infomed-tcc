import { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import { bus, type DueReminder } from '../notifications/NotificationBus';
import { ReminderScheduler } from './ReminderScheduler';
import { adherenceRepository, reminderRepository } from '../../repositories';
import { useAuth } from '../auth/AuthContext';

/** A dose já foi registrada (pela caixa ou pelo botão "Tomei")? */
async function isTaken(reminderId: string, scheduledAt: string) {
  const doses = await adherenceRepository.todayDoses();
  const at = new Date(scheduledAt).getTime();
  return doses.some((d) => d.reminderId === reminderId && new Date(d.scheduledAt).getTime() === at && d.status === 'tomada');
}

/** Liga o agendador (quando há usuário logado) e mostra o aviso "Hora do remédio" na tela. */
export function ReminderAlerts() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<DueReminder[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const scheduler = new ReminderScheduler(() => reminderRepository.list(), 20_000, () => new Date(), isTaken);
    void scheduler.start();
    const off = bus.on('reminder-due', (d) => setQueue((q) => [...q, d]));
    return () => {
      scheduler.stop();
      off();
    };
  }, [user?.id]);

  const current = queue[0];
  if (!current) return null;

  const close = () => {
    setError('');
    setQueue((q) => q.slice(1));
  };
  const snooze = () => {
    const d = current;
    close();
    setTimeout(() => bus.emit('reminder-due', d), 10 * 60_000);
  };
  const took = async () => {
    if (!current.scheduledAt) return close();
    try {
      await adherenceRepository.confirmDose(current.reminderId, current.scheduledAt);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar a dose.');
    }
  };
  const isCheck = current.kind === 'check';

  return (
    <div role="alert" className="absolute top-3 left-3 right-3 z-[2000] bg-white rounded-2xl shadow-xl border border-[#FFCC48] p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 bg-[#27C183]/10 rounded-xl flex items-center justify-center">
          <Pill className="w-5 h-5 text-[#27C183]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#1A2B48]">{isCheck ? `Você tomou ${current.label} das ${current.time}?` : 'Hora do remédio'}</p>
          <p className="text-[#64748B] text-sm">
            {isCheck
              ? 'A caixa ainda não registrou esta dose.'
              : `${current.label} · ${current.time}${current.note ? ` · ${current.note}` : ''}`}
          </p>
          {error && <p className="text-[#C6283A] text-sm mt-1">{error}</p>}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {isCheck ? (
          <>
            <button onClick={took} className="flex-1 h-10 bg-[#27C183] text-white rounded-xl">Tomei</button>
            <button onClick={close} className="flex-1 h-10 bg-[#F7FAFF] text-[#0A73FF] rounded-xl">Ainda não</button>
          </>
        ) : (
          <>
            <button onClick={close} className="flex-1 h-10 bg-[#0A73FF] text-white rounded-xl">Ok, entendi</button>
            <button onClick={snooze} className="flex-1 h-10 bg-[#F7FAFF] text-[#0A73FF] rounded-xl">Adiar 10 min</button>
          </>
        )}
      </div>
    </div>
  );
}
