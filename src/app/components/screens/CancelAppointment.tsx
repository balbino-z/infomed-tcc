import { AlertCircle, Calendar, Clock, User } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';

interface CancelAppointmentProps {
  navigate: (screen: Screen) => void;
  appointment?: any;
}

export function CancelAppointment({ navigate, appointment }: CancelAppointmentProps) {
  const handleCancel = () => {
    // Show success message and navigate
    navigate('history');
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Cancelar Consulta"
        onBack={() => navigate('history')}
        showNotification={false}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Warning Card */}
        <div className="bg-[#FFCC48]/10 rounded-2xl p-4 mb-6 border border-[#FFCC48]/20 flex gap-3">
          <AlertCircle className="w-6 h-6 text-[#FFCC48] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#1A2B48] mb-2">Atenção</p>
            <p className="text-[#CED6E0] text-sm leading-relaxed">
              Você tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-6">
          <h3 className="text-[#1A2B48] mb-4">Detalhes da Consulta</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0A73FF]/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-[#0A73FF]" />
              </div>
              <div>
                <p className="text-[#CED6E0] text-sm">Médico</p>
                <p className="text-[#1A2B48]">Dr. Carlos Santos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27C183]/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#27C183]" />
              </div>
              <div>
                <p className="text-[#CED6E0] text-sm">Data</p>
                <p className="text-[#1A2B48]">28 Dez 2024</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFCC48]/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FFCC48]" />
              </div>
              <div>
                <p className="text-[#CED6E0] text-sm">Horário</p>
                <p className="text-[#1A2B48]">14:30</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancelation Reason */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <h3 className="text-[#1A2B48] mb-4">Motivo do Cancelamento (Opcional)</h3>
          
          <textarea
            placeholder="Descreva o motivo do cancelamento..."
            className="w-full h-32 p-4 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] placeholder:text-[#CED6E0] focus:outline-none focus:border-[#0A73FF] resize-none"
          />
        </div>
      </div>

      {/* Fixed Actions */}
      <div className="px-6 py-4 bg-white border-t border-[#E8F1FF] space-y-3">
        <button
          onClick={handleCancel}
          className="w-full h-[52px] bg-[#FF4D5E] text-white rounded-2xl hover:bg-[#FF3347] transition-colors"
        >
          Confirmar Cancelamento
        </button>
        
        <button
          onClick={() => navigate('history')}
          className="w-full h-[52px] bg-[#F7FAFF] text-[#1A2B48] rounded-2xl hover:bg-[#E8F1FF] transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
