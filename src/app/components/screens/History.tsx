import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { BottomNav } from '../shared/BottomNav';
import type { Appointment } from '../../domain/appointment';
import { appointmentRepository } from '../../repositories';
import { AppointmentFactory } from '../../features/scheduling/AppointmentFactory';
import { formatDateSP, formatTimeSP } from '../../features/scheduling/dateUtils';

interface HistoryProps {
  navigate: (screen: Screen, data?: any) => void;
}

type Label = { text: string; cls: string };

// Consulta ativa já passada é exibida como "Realizada" (a unidade não registra comparecimento no app)
function labelFor(a: Appointment, now: number): Label {
  if (a.status === 'cancelada') return { text: 'Cancelada', cls: 'bg-[#FF4D5E]/10 text-[#FF4D5E] border-[#FF4D5E]/20' };
  if (a.status === 'concluida' || new Date(a.startsAt).getTime() <= now) return { text: 'Realizada', cls: 'bg-[#0A73FF]/10 text-[#0A73FF] border-[#0A73FF]/20' };
  return { text: 'Confirmada', cls: 'bg-[#27C183]/10 text-[#27C183] border-[#27C183]/20' };
}

export function History({ navigate }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    appointmentRepository
      .listMine()
      .then(setItems)
      .catch(() => setError('Não foi possível carregar suas consultas.'))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const isUpcoming = (a: Appointment) => a.status === 'agendada' && new Date(a.startsAt).getTime() > now;
  const upcoming = items.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = items.filter((a) => !isUpcoming(a)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const shown = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Histórico" onBack={() => navigate('home')} onNotification={() => navigate('notifications')} />

      <div className="px-6 py-4">
        <div className="bg-white rounded-2xl p-1 border border-[#E8F1FF] flex">
          {(['upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 h-10 rounded-xl transition-all ${activeTab === tab ? 'bg-[#0A73FF] text-white' : 'text-[#64748B]'}`}
            >
              {tab === 'upcoming' ? 'Próximas' : 'Anteriores'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {loading ? (
          <p className="text-[#64748B]">Carregando...</p>
        ) : error ? (
          <p role="alert" className="text-[#FF4D5E]">{error}</p>
        ) : shown.length > 0 ? (
          <div className="space-y-3">
            {shown.map((apt) => {
              const label = labelFor(apt, now);
              return (
                <div key={apt.id} className="bg-white p-4 rounded-2xl border border-[#E8F1FF]">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1A2B48] mb-1">{apt.doctorName}</h4>
                      <p className="text-[#64748B] text-sm">
                        {apt.specialty} · {AppointmentFactory.rulesFor(apt.kind).label}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs border ${label.cls}`}>{label.text}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateSP(apt.startsAt)}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeSP(apt.startsAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <MapPin className="w-4 h-4" />
                      <span>{apt.unitName}</span>
                    </div>
                  </div>

                  {isUpcoming(apt) && (
                    <div className="mt-4 pt-4 border-t border-[#E8F1FF]">
                      <button
                        onClick={() => navigate('cancel-appointment', { selectedAppointment: apt })}
                        className="w-full h-10 bg-[#FF4D5E]/10 text-[#FF4D5E] rounded-xl hover:bg-[#FF4D5E]/20 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#F7FAFF] rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-[#CED6E0]" />
            </div>
            <p className="text-[#64748B] text-center">{activeTab === 'upcoming' ? 'Nenhuma consulta agendada' : 'Nenhuma consulta anterior'}</p>
            {activeTab === 'upcoming' && (
              <button onClick={() => navigate('schedule-specialty')} className="mt-6 px-6 h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors">
                Agendar Consulta
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav active="home" onNavigate={navigate} />
    </div>
  );
}
