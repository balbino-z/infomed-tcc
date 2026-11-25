import { useEffect, useRef, useState } from 'react';
import { Bell, Clock, Plus, Trash2 } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { BottomNav } from '../shared/BottomNav';
import type { Reminder } from '../../domain/reminder';
import { describeDays } from '../../domain/reminder';
import { adherenceRepository, reminderRepository } from '../../repositories';
import { bus, emitDosesChanged } from '../../features/notifications/NotificationBus';
import type { TodayDose } from '../../domain/adherence';
import { newlyTaken } from '../../features/adherence/doses';
import { formatTimeSP } from '../../features/scheduling/dateUtils';

const BADGE: Record<TodayDose['status'], { icon: string; text: string; cls: string }> = {
  tomada: { icon: '✅', text: 'tomada', cls: 'bg-[#27C183]/10 text-[#16784B]' },
  pendente: { icon: '⏳', text: 'pendente', cls: 'bg-[#0A73FF]/10 text-[#0A73FF]' },
  atrasada: { icon: '⚠️', text: 'atrasada', cls: 'bg-[#FFCC48]/25 text-[#8A5A00]' },
  esquecida: { icon: '❌', text: 'esquecida', cls: 'bg-[#FF4D5E]/10 text-[#C6283A]' },
};

const FRESH_MS = 15_000; // quanto tempo a dose recém-confirmada fica destacada

/** Doses de hoje com selo, destaque da dose confirmada pela caixa e o botão "Tomei" (para quem não tem a caixa). */
function TodayDoses() {
  const [doses, setDoses] = useState<TodayDose[]>([]);
  const [error, setError] = useState('');
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [announce, setAnnounce] = useState('');
  const previous = useRef<TodayDose[] | null>(null);

  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const load = () =>
      adherenceRepository
        .todayDoses()
        .then((d) => {
          if (!active) return;
          const changed = previous.current ? newlyTaken(previous.current, d) : [];
          previous.current = d;
          setDoses(d);
          if (changed.length === 0) return;
          const keys = changed.map((x) => `${x.reminderId}|${x.time}`);
          setFresh((s) => new Set([...s, ...keys]));
          const fromBox = changed.filter((x) => x.source === 'caixa');
          if (fromBox.length) {
            setAnnounce(`Caixa confirmou: ${fromBox.map((x) => `${x.label} das ${x.time}`).join(', ')}`);
            if (changed.length === fromBox.length) emitDosesChanged(); // atualiza a adesão no Perfil
          }
          timers.push(setTimeout(() => {
            setFresh((s) => new Set([...s].filter((k) => !keys.includes(k))));
            setAnnounce('');
          }, FRESH_MS));
        })
        .catch(() => {});
    void load();
    const offR = bus.on('reminders-changed', () => void load());
    const offD = bus.on('doses-changed', () => void load());
    const t = setInterval(() => void load(), 10_000); // a caixa grava doses: confere a cada 10 s
    return () => { active = false; offR(); offD(); clearInterval(t); timers.forEach(clearTimeout); };
  }, []);

  const confirm = async (d: TodayDose) => {
    setError('');
    try {
      await adherenceRepository.confirmDose(d.reminderId, d.scheduledAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar a dose.');
    }
  };

  if (doses.length === 0) return null;
  return (
    <section className="mb-6" aria-label="Doses de hoje">
      <h3 className="text-[#1A2B48] mb-3">Hoje</h3>
      {error && <p role="alert" className="mb-2 text-sm text-[#FF4D5E]">{error}</p>}
      <p aria-live="polite" className={announce ? 'mb-2 rounded-xl bg-[#27C183] px-3 py-2 text-sm text-white' : 'sr-only'}>
        {announce && `📦 ${announce}`}
      </p>
      <ul className="bg-white rounded-2xl border border-[#E8F1FF] divide-y divide-[#E8F1FF] overflow-hidden">
        {doses.map((d) => {
          const b = BADGE[d.status];
          const key = `${d.reminderId}|${d.time}`;
          const isFresh = fresh.has(key);
          const detail = d.takenAt
            ? `tomada às ${formatTimeSP(d.takenAt)}${d.takenLate ? ' (com atraso)' : ''}`
            : b.text;
          const rowCls = isFresh
            ? 'bg-[#27C183]/20 ring-2 ring-inset ring-[#27C183] animate-pulse'
            : d.status === 'tomada' ? 'bg-[#27C183]/5' : '';
          return (
            <li key={key} data-testid={`dose-${d.time}`} data-fresh={isFresh || undefined} className={`flex items-center gap-3 p-3 transition-colors ${rowCls}`}>
              <div className="min-w-0 flex-1">
                <p className="text-[#1A2B48] text-sm truncate">{`${d.time} · ${d.label}`}</p>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs ${b.cls}`}>{`${b.icon} ${detail}`}</span>
                {d.source === 'caixa' && (
                  <span className="ml-1 inline-block mt-1 rounded-full bg-[#0A73FF] px-2 py-0.5 text-xs text-white">📦 pela caixa</span>
                )}
              </div>
              {d.canConfirm && (
                <button onClick={() => confirm(d)} aria-label={`Tomei ${d.label} das ${d.time}`} className="shrink-0 h-9 px-4 rounded-xl bg-[#27C183] text-white text-sm">
                  Tomei
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

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

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-64">
        {permission === 'default' && (
          <button onClick={enableDeviceAlerts} className="w-full mb-4 p-4 bg-[#0A73FF]/10 text-[#0A73FF] rounded-2xl text-left text-sm">
            🔔 Ativar avisos no aparelho. Eles funcionam com o app aberto.
          </button>
        )}

        <TodayDoses />

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
        className="absolute bottom-[11.5rem] right-4 z-30 w-14 h-14 bg-[#0A73FF] text-white rounded-2xl shadow-lg hover:bg-[#005BEA] transition-all flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav active="reminders" onNavigate={navigate} />
    </div>
  );
}
