import { useEffect, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import type { Medication } from '../../domain/medication';
import { ALL_DAYS, DAY_NAMES, WEEKDAYS_ONLY } from '../../domain/reminder';
import { medicationRepository, reminderRepository } from '../../repositories';

interface CreateReminderProps {
  navigate: (screen: Screen, data?: any) => void;
  medication?: Medication;
}

const QUICK_TIMES = ['06:00', '08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];
type DaysMode = 'all' | 'weekdays' | 'custom';

const cls = (on: boolean) => `px-4 h-10 rounded-xl border-2 transition-all ${on ? 'bg-[#0A73FF] border-[#0A73FF] text-white' : 'bg-white border-[#E8F1FF] text-[#1A2B48]'}`;

export function CreateReminder({ navigate, medication }: CreateReminderProps) {
  const [label, setLabel] = useState(medication ? `${medication.name} ${medication.dosage}` : '');
  const [medicationId, setMedicationId] = useState<string | null>(medication?.id ? String(medication.id) : null);
  const [catalog, setCatalog] = useState<Medication[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState('');
  const [mode, setMode] = useState<DaysMode>('all');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    medicationRepository.list().then(setCatalog).catch(() => {});
  }, []);

  const toggleTime = (t: string) => setTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t].sort()));
  const addCustom = () => {
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(customTime) && !times.includes(customTime)) setTimes((cur) => [...cur, customTime].sort());
    setCustomTime('');
  };
  const toggleDay = (d: number) => setCustomDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const handleSave = async () => {
    setError('');
    const days = mode === 'all' ? ALL_DAYS : mode === 'weekdays' ? WEEKDAYS_ONLY : customDays;
    if (!label.trim()) return setError('Informe o nome do medicamento.');
    if (times.length === 0) return setError('Escolha pelo menos um horário.');
    if (days.length === 0) return setError('Escolha pelo menos um dia da semana.');
    setBusy(true);
    try {
      await reminderRepository.create({ label, medicationId, times, daysOfWeek: days, note: note || null });
      navigate('reminders');
    } catch {
      setError('Não foi possível salvar o lembrete. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Novo Lembrete" onBack={() => navigate('reminders')} showNotification={false} />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <label htmlFor="rem-name" className="block text-[#1A2B48] mb-3">Nome do Medicamento</label>
          <input
            id="rem-name"
            type="text"
            maxLength={80}
            placeholder="Ex: Losartana 50mg"
            value={label}
            onChange={(e) => { setLabel(e.target.value); setMedicationId(null); }}
            className="w-full h-12 px-4 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] placeholder:text-[#CED6E0] focus:outline-none focus:border-[#0A73FF]"
          />
          {catalog.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {catalog.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setLabel(`${m.name} ${m.dosage}`); setMedicationId(m.id); }}
                  className="px-3 py-1 text-xs rounded-lg bg-[#F7FAFF] text-[#0A73FF]"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <p className="text-[#1A2B48] mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-[#0A73FF]" />Horários</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[...new Set([...QUICK_TIMES, ...times])].sort().map((t) => (
              <button key={t} aria-pressed={times.includes(t)} onClick={() => toggleTime(t)} className={cls(times.includes(t))}>{t}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="time" aria-label="Outro horário" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="flex-1 h-10 px-3 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF]" />
            <button onClick={addCustom} className="px-4 h-10 rounded-xl bg-[#F7FAFF] text-[#0A73FF]">Adicionar</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <p className="text-[#1A2B48] mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#0A73FF]" />Dias</p>
          <div className="flex gap-2 flex-wrap mb-3">
            <button aria-pressed={mode === 'all'} onClick={() => setMode('all')} className={cls(mode === 'all')}>Todos os dias</button>
            <button aria-pressed={mode === 'weekdays'} onClick={() => setMode('weekdays')} className={cls(mode === 'weekdays')}>Seg a Sex</button>
            <button aria-pressed={mode === 'custom'} onClick={() => setMode('custom')} className={cls(mode === 'custom')}>Escolher</button>
          </div>
          {mode === 'custom' && (
            <div className="flex gap-1">
              {DAY_NAMES.map((n, d) => (
                <button key={n} aria-pressed={customDays.includes(d)} onClick={() => toggleDay(d)} className={`flex-1 h-10 rounded-lg text-xs border-2 ${customDays.includes(d) ? 'bg-[#0A73FF] border-[#0A73FF] text-white' : 'bg-white border-[#E8F1FF] text-[#1A2B48]'}`}>{n}</button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <label htmlFor="rem-note" className="block text-[#1A2B48] mb-3">Observação (opcional)</label>
          <input
            id="rem-note"
            type="text"
            maxLength={200}
            placeholder="Ex: Antes do café da manhã"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] placeholder:text-[#CED6E0] focus:outline-none focus:border-[#0A73FF]"
          />
        </div>

        {error && <p role="alert" className="text-[#FF4D5E] text-sm">{error}</p>}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-[#E8F1FF]">
        <button onClick={handleSave} disabled={busy} className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors disabled:opacity-60">
          {busy ? 'Salvando...' : 'Salvar Lembrete'}
        </button>
      </div>
    </div>
  );
}
