import { CheckCircle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Screen } from '../../App';
import type { Appointment } from '../../domain/appointment';
import { AppointmentFactory } from '../../features/scheduling/AppointmentFactory';
import { formatDateSP, formatTimeSP } from '../../features/scheduling/dateUtils';

interface AppointmentConfirmedProps {
  navigate: (screen: Screen) => void;
  appointment?: Appointment;
}

export function AppointmentConfirmed({ navigate, appointment }: AppointmentConfirmedProps) {
  const rows = appointment
    ? [
        { icon: User, bg: 'bg-[#0A73FF]/10', color: 'text-[#0A73FF]', label: 'Médico', value: `${appointment.doctorName} · ${appointment.specialty}` },
        { icon: Calendar, bg: 'bg-[#27C183]/10', color: 'text-[#27C183]', label: 'Data', value: formatDateSP(appointment.startsAt) },
        { icon: Clock, bg: 'bg-[#FFCC48]/10', color: 'text-[#FFCC48]', label: 'Horário', value: formatTimeSP(appointment.startsAt) },
        { icon: MapPin, bg: 'bg-[#0A73FF]/10', color: 'text-[#0A73FF]', label: 'Local', value: appointment.unitName },
      ]
    : [];

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-24 h-24 bg-[#27C183]/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-[#27C183]" />
        </div>

        <h2 className="text-[#1A2B48] text-center mb-3">
          {appointment ? `${AppointmentFactory.rulesFor(appointment.kind).label} Confirmada!` : 'Agendamento'}
        </h2>
        <p className="text-[#64748B] text-center mb-8">Enviamos uma notificação com os detalhes. Chegue 10 minutos antes.</p>

        <div className="w-full bg-white rounded-3xl p-6 border border-[#E8F1FF] mb-8">
          <div className="space-y-4">
            {rows.map(({ icon: Icon, bg, color, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[#64748B] text-sm">{label}</p>
                  <p className="text-[#1A2B48]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-3">
          <button onClick={() => navigate('home')} className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors">
            Voltar ao Início
          </button>
          <button onClick={() => navigate('history')} className="w-full h-[52px] bg-white text-[#0A73FF] rounded-2xl border-2 border-[#0A73FF] hover:bg-[#F7FAFF] transition-colors">
            Ver Minhas Consultas
          </button>
        </div>
      </div>
    </div>
  );
}
