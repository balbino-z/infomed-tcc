import { useState } from 'react';
import { Calendar, Clock, MapPin, MoreVertical } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { BottomNav } from '../shared/BottomNav';

interface HistoryProps {
  navigate: (screen: Screen, data?: any) => void;
}

const appointments = [
  {
    id: 1,
    doctor: 'Dr. Carlos Santos',
    specialty: 'Cardiologia',
    date: '28 Dez 2024',
    time: '14:30',
    location: 'UBS Central',
    status: 'confirmado',
    type: 'upcoming'
  },
  {
    id: 2,
    doctor: 'Dra. Ana Paula Lima',
    specialty: 'Clínico Geral',
    date: '15 Dez 2024',
    time: '09:00',
    location: 'UBS Vila Nova',
    status: 'realizado',
    type: 'past'
  },
  {
    id: 3,
    doctor: 'Dr. Roberto Silva',
    specialty: 'Ortopedia',
    date: '05 Dez 2024',
    time: '15:00',
    location: 'UBS Central',
    status: 'realizado',
    type: 'past'
  },
  {
    id: 4,
    doctor: 'Dra. Maria Costa',
    specialty: 'Dermatologia',
    date: '20 Nov 2024',
    time: '10:30',
    location: 'UBS Jardim América',
    status: 'cancelado',
    type: 'past'
  },
];

export function History({ navigate }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const filteredAppointments = appointments.filter(apt => apt.type === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-[#27C183]/10 text-[#27C183] border-[#27C183]/20';
      case 'realizado':
        return 'bg-[#0A73FF]/10 text-[#0A73FF] border-[#0A73FF]/20';
      case 'cancelado':
        return 'bg-[#FF4D5E]/10 text-[#FF4D5E] border-[#FF4D5E]/20';
      default:
        return 'bg-[#CED6E0]/10 text-[#CED6E0] border-[#CED6E0]/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'Confirmado';
      case 'realizado':
        return 'Realizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return '';
    }
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Histórico"
        onBack={() => navigate('home')}
        onNotification={() => navigate('notifications')}
      />

      {/* Tabs */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-2xl p-1 border border-[#E8F1FF] flex">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 h-10 rounded-xl transition-all ${
              activeTab === 'upcoming'
                ? 'bg-[#0A73FF] text-white'
                : 'text-[#CED6E0]'
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 h-10 rounded-xl transition-all ${
              activeTab === 'past'
                ? 'bg-[#0A73FF] text-white'
                : 'text-[#CED6E0]'
            }`}
          >
            Anteriores
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {filteredAppointments.length > 0 ? (
          <div className="space-y-3">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white p-4 rounded-2xl border border-[#E8F1FF]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-[#1A2B48] mb-1">{apt.doctor}</h4>
                    <p className="text-[#CED6E0] text-sm">{apt.specialty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(apt.status)}`}>
                      {getStatusText(apt.status)}
                    </span>
                    {apt.status === 'confirmado' && (
                      <button className="w-8 h-8 flex items-center justify-center">
                        <MoreVertical className="w-5 h-5 text-[#CED6E0]" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[#CED6E0]">
                    <Calendar className="w-4 h-4" />
                    <span>{apt.date}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{apt.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-[#CED6E0]">
                    <MapPin className="w-4 h-4" />
                    <span>{apt.location}</span>
                  </div>
                </div>

                {apt.status === 'confirmado' && (
                  <div className="mt-4 pt-4 border-t border-[#E8F1FF] flex gap-2">
                    <button className="flex-1 h-10 bg-[#F7FAFF] text-[#0A73FF] rounded-xl hover:bg-[#E8F1FF] transition-colors">
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => navigate('cancel-appointment', { selectedAppointment: apt })}
                      className="flex-1 h-10 bg-[#FF4D5E]/10 text-[#FF4D5E] rounded-xl hover:bg-[#FF4D5E]/20 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#F7FAFF] rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-[#CED6E0]" />
            </div>
            <p className="text-[#CED6E0] text-center">
              {activeTab === 'upcoming' 
                ? 'Nenhuma consulta agendada' 
                : 'Nenhuma consulta anterior'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('schedule-specialty')}
                className="mt-6 px-6 h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors"
              >
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
