import { useState } from 'react';
import { Clock, Calendar, Bell, Repeat } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';

interface CreateReminderProps {
  navigate: (screen: Screen, data?: any) => void;
  medication?: any;
  appState?: any;
}

const frequencies = [
  { id: 'daily', label: 'Todos os dias' },
  { id: 'interval', label: 'A cada X horas' },
  { id: 'weekly', label: 'Dias da semana' },
  { id: 'custom', label: 'Personalizado' },
];

const times = ['08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

export function CreateReminder({ navigate, medication, appState }: CreateReminderProps) {
  const [medicationName, setMedicationName] = useState(medication?.name || '');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('daily');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const newReminder = {
      id: Date.now(),
      medication: medicationName,
      time: selectedTime,
      frequency: selectedFrequency === 'daily' ? 'Todos os dias' : 
                 selectedFrequency === 'interval' ? 'A cada X horas' :
                 selectedFrequency === 'weekly' ? 'Dias da semana' : 'Personalizado',
      note: note,
      active: true
    };
    
    // Pega os lembretes existentes do appState e adiciona o novo
    const currentReminders = appState?.reminders || [];
    const updatedReminders = [...currentReminders, newReminder];
    
    navigate('reminders', { 
      reminders: updatedReminders
    });
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Novo Lembrete"
        onBack={() => navigate('reminders')}
        showNotification={false}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        {/* Medication Name */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-4">
          <label className="block text-[#1A2B48] mb-3">
            Nome do Medicamento
          </label>
          <input
            type="text"
            placeholder="Ex: Losartana 50mg"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] placeholder:text-[#CED6E0] focus:outline-none focus:border-[#0A73FF]"
          />
        </div>

        {/* Time Selection */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-4">
          <label className="block text-[#1A2B48] mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0A73FF]" />
            Horário
          </label>
          <div className="grid grid-cols-3 gap-2">
            {times.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`h-12 rounded-xl border-2 transition-all ${
                  selectedTime === time
                    ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
                    : 'bg-[#F7FAFF] border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          <button className="w-full mt-3 text-[#0A73FF] text-sm text-left">
            + Adicionar horário personalizado
          </button>
        </div>

        {/* Frequency */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-4">
          <label className="block text-[#1A2B48] mb-3 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#27C183]" />
            Frequência
          </label>
          <div className="space-y-2">
            {frequencies.map((freq) => (
              <button
                key={freq.id}
                onClick={() => setSelectedFrequency(freq.id)}
                className={`w-full h-12 px-4 rounded-xl border-2 transition-all text-left ${
                  selectedFrequency === freq.id
                    ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
                    : 'bg-[#F7FAFF] border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-4">
          <label className="block text-[#1A2B48] mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FFCC48]" />
            Data de Início
          </label>
          <input
            type="date"
            className="w-full h-12 px-4 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] focus:outline-none focus:border-[#0A73FF]"
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <label className="block text-[#1A2B48] mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0A73FF]" />
            Observações (Opcional)
          </label>
          <textarea
            placeholder="Ex: Tomar com água, antes das refeições..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-24 p-4 rounded-xl bg-[#F7FAFF] border border-[#E8F1FF] text-[rgb(29,40,58)] placeholder:text-[#CED6E0] focus:outline-none focus:border-[#0A73FF] resize-none"
          />
        </div>
      </div>

      {/* Fixed Actions */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-[#E8F1FF] space-y-3">
        <button
          onClick={handleSave}
          disabled={!medicationName || !selectedTime}
          className={`w-full h-[52px] rounded-2xl transition-colors ${
            medicationName && selectedTime
              ? 'bg-[#0A73FF] text-white hover:bg-[#005BEA]'
              : 'bg-[#CED6E0] text-white cursor-not-allowed'
          }`}
        >
          Salvar Lembrete
        </button>
        
        <button
          onClick={() => navigate('reminders')}
          className="w-full h-[52px] bg-[#F7FAFF] text-[#1A2B48] rounded-2xl hover:bg-[#E8F1FF] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}