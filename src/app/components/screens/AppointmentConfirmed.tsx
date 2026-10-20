import { CheckCircle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Screen } from '../../App';

interface AppointmentConfirmedProps {
  navigate: (screen: Screen) => void;
  appointment?: any;
}

export function AppointmentConfirmed({ navigate, appointment }: AppointmentConfirmedProps) {
  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-24 h-24 bg-[#27C183]/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-[#27C183]" />
        </div>
        
        <h2 className="text-[#1A2B48] text-center mb-3">
          Consulta Confirmada!
        </h2>
        <p className="text-[#CED6E0] text-center mb-8">
          Você receberá uma notificação de lembrete antes da consulta
        </p>

        {/* Appointment Card */}
        <div className="w-full bg-white rounded-3xl p-6 border border-[#E8F1FF] mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0A73FF]/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-[#0A73FF]" />
              </div>
              <div>
                <p className="text-[#CED6E0] text-sm">Médico</p>
                <p className="text-[#1A2B48]">{appointment?.selectedDoctor?.name || 'Dr. Carlos Santos'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27C183]/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#27C183]" />
              </div>
              <div>
                <p className="text-[#CED6E0] text-sm">Data</p>
                <p className="text-[#1A2B48]">{appointment?.selectedDate || '18 Dez 2024'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFCC48]/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FFCC48]" />
              </div>
              <div>
                <p className="text-[#CED6E0] text-sm">Horário</p>
                <p className="text-[#1A2B48]">{appointment?.selectedTime || '14:30'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0A73FF]/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#0A73FF]" />
              </div>
              <div>
                <p className="text-[#CED6E0] text-sm">Local</p>
                <p className="text-[#1A2B48]">UBS Central</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('home')}
            className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors"
          >
            Voltar ao Início
          </button>
          
          <button
            onClick={() => navigate('history')}
            className="w-full h-[52px] bg-white text-[#0A73FF] rounded-2xl border-2 border-[#0A73FF] hover:bg-[#F7FAFF] transition-colors"
          >
            Ver Minhas Consultas
          </button>
        </div>
      </div>
    </div>
  );
}
