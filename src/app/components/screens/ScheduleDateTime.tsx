import { useEffect, useMemo, useState } from 'react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import type { Doctor, AppointmentKind } from '../../domain/appointment';
import { appointmentRepository } from '../../repositories';
import { AppointmentFactory } from '../../features/scheduling/AppointmentFactory';
import { generateDaySlots } from '../../features/scheduling/slots';
import { monthYearLabel, nextBusinessDays, toStartsAt } from '../../features/scheduling/dateUtils';

interface ScheduleDateTimeProps {
  navigate: (screen: Screen, data?: any) => void;
  doctor?: Doctor;
  kind?: AppointmentKind;
}

export function ScheduleDateTime({ navigate, doctor, kind = 'consulta' }: ScheduleDateTimeProps) {
  const days = useMemo(() => nextBusinessDays(10), []);
  const [selectedDay, setSelectedDay] = useState(days[0].iso);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<Set<number>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadBooked = () => {
    if (!doctor) return Promise.resolve();
    const from = new Date(toStartsAt(days[0].iso, '00:00'));
    const to = new Date(toStartsAt(days[days.length - 1].iso, '23:59'));
    return appointmentRepository
      .bookedSlots(doctor.id, from, to)
      .then((list) => setBooked(new Set(list.map((iso) => new Date(iso).getTime()))))
      .catch(() => setError('Não foi possível carregar os horários.'))
      .finally(() => setLoadingSlots(false));
  };

  useEffect(() => {
    void loadBooked();
  }, [doctor?.id]);

  const slots = useMemo(
    () => (doctor ? generateDaySlots(selectedDay, doctor, booked, AppointmentFactory.earliestStart(kind)) : []),
    [doctor, selectedDay, booked, kind],
  );
  const morning = slots.filter((s) => s.time < '12:00');
  const afternoon = slots.filter((s) => s.time >= '12:00');

  const handleConfirm = async () => {
    if (!doctor || !selectedTime) return;
    setError('');
    setBusy(true);
    try {
      // PADRÃO FACTORY: a fábrica valida as regras do tipo e monta o pedido
      const draft = AppointmentFactory.create(kind, doctor, toStartsAt(selectedDay, selectedTime));
      const appointment = await appointmentRepository.create(draft);
      navigate('appointment-confirmed', { lastBooked: appointment });
    } catch (e) {
      setError((e as Error).message);
      setSelectedTime(null);
      void loadBooked(); // o horário pode ter sido ocupado por outra pessoa
    } finally {
      setBusy(false);
    }
  };

  const slotButton = (s: { time: string; available: boolean }) => (
    <button
      key={s.time}
      disabled={!s.available}
      onClick={() => setSelectedTime(s.time)}
      className={`h-12 rounded-xl border-2 transition-all ${
        !s.available
          ? 'bg-[#F7FAFF] border-[#F0F4FA] text-[#CED6E0] line-through cursor-not-allowed'
          : selectedTime === s.time
            ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
            : 'bg-white border-[#E8F1FF] text-[#1A2B48]'
      }`}
    >
      {s.time}
    </button>
  );

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Data e Hora" onBack={() => navigate('schedule-doctor')} showNotification={false} />

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
        </div>
        <div className="mb-2">
          <h2 className="text-[#1A2B48] mb-2">Escolha Data e Hora</h2>
          <p className="text-[#64748B]">
            Passo 3 de 3 • {doctor?.name} • {AppointmentFactory.rulesFor(kind).label}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <div className="mb-6">
          <h3 className="text-[#1A2B48] mb-4">{monthYearLabel(selectedDay)}</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d.iso}
                onClick={() => { setSelectedDay(d.iso); setSelectedTime(null); setError(''); }}
                className={`flex-shrink-0 w-16 py-3 rounded-2xl border-2 transition-all ${
                  selectedDay === d.iso ? 'bg-[#0A73FF] border-[#0A73FF] text-white' : 'bg-white border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                <div className="text-xs mb-1">{d.weekday}</div>
                <div className="text-xl">{d.day}</div>
              </button>
            ))}
          </div>
        </div>

        {loadingSlots ? (
          <p className="text-[#64748B]">Carregando horários...</p>
        ) : (
          <>
            {morning.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[#1A2B48] mb-4">Manhã</h3>
                <div className="grid grid-cols-4 gap-2">{morning.map(slotButton)}</div>
              </div>
            )}
            {afternoon.length > 0 && (
              <div>
                <h3 className="text-[#1A2B48] mb-4">Tarde</h3>
                <div className="grid grid-cols-4 gap-2">{afternoon.map(slotButton)}</div>
              </div>
            )}
            {slots.length > 0 && slots.every((s) => !s.available) && (
              <p className="text-[#64748B] mt-4 text-sm">Sem horários livres neste dia. Escolha outra data.</p>
            )}
          </>
        )}

        {error && <p role="alert" className="text-[#FF4D5E] text-sm mt-4">{error}</p>}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-[#E8F1FF]">
        <button
          onClick={handleConfirm}
          disabled={!selectedTime || busy}
          className={`w-full h-[52px] rounded-2xl transition-colors ${
            selectedTime && !busy ? 'bg-[#0A73FF] text-white hover:bg-[#005BEA]' : 'bg-[#CED6E0] text-white cursor-not-allowed'
          }`}
        >
          {busy ? 'Agendando...' : 'Confirmar Agendamento'}
        </button>
      </div>
    </div>
  );
}
