import { useState } from 'react';
import { AlertCircle, Calendar, Clock, User } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import type { Appointment } from '../../domain/appointment';
import { appointmentRepository } from '../../repositories';
import { formatDateSP, formatTimeSP } from '../../features/scheduling/dateUtils';

interface CancelAppointmentProps {
  navigate: (screen: Screen, data?: any) => void;
  appointment?: Appointment;
}

export function CancelAppointment({ navigate, appointment }: CancelAppointmentProps) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    if (!appointment) return;
    setBusy(true);
    setError('');
    try {
      await appointmentRepository.cancel(appointment.id, reason);
      navigate('history');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Cancelar Consulta" onBack={() => navigate('history')} showNotification={false} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="bg-[#FFCC48]/10 rounded-2xl p-4 mb-6 border border-[#FFCC48]/20 flex gap-3">
          <AlertCircle className="w-6 h-6 text-[#FFCC48] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#1A2B48] mb-2">Atenção</p>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Você tem certeza que deseja cancelar esta consulta? O horário será liberado para outras pessoas e esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        {appointment && (
          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-6">
            <h3 className="text-[#1A2B48] mb-4">Detalhes da Consulta</h3>
            <div className="space-y-4">
              {[
                { icon: User, bg: 'bg-[#0A73FF]/10', color: 'text-[#0A73FF]', label: 'Médico', value: `${appointment.doctorName} · ${appointment.specialty}` },
                { icon: Calendar, bg: 'bg-[#27C183]/10', color: 'text-[#27C183]', label: 'Data', value: formatDateSP(appointment.startsAt) },
                { icon: Clock, bg: 'bg-[#FFCC48]/10', color: 'text-[#FFCC48]', label: 'Horário', value: formatTimeSP(appointment.startsAt) },
              ].map(({ icon: Icon, bg, color, label, value }) => (
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
        )}

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <h3 className="text-[#1A2B48] mb-4">Motivo do Cancelamento (Opcional)</h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Descreva o motivo do cancelamento..."
            className="w-full h-32 p-4 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] placeholder:text-[#CED6E0] focus:outline-none focus:border-[#0A73FF] resize-none"
          />
        </div>

        {error && <p role="alert" className="text-[#FF4D5E] text-sm mt-4">{error}</p>}
      </div>

      <div className="px-6 py-4 bg-white border-t border-[#E8F1FF] space-y-3">
        <button
          onClick={handleCancel}
          disabled={busy || !appointment}
          className="w-full h-[52px] bg-[#FF4D5E] text-white rounded-2xl hover:bg-[#FF3347] transition-colors disabled:opacity-60"
        >
          {busy ? 'Cancelando...' : 'Confirmar Cancelamento'}
        </button>
        <button onClick={() => navigate('history')} className="w-full h-[52px] bg-[#F7FAFF] text-[#1A2B48] rounded-2xl hover:bg-[#E8F1FF] transition-colors">
          Voltar
        </button>
      </div>
    </div>
  );
}
