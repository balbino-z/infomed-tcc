import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';

interface ScheduleDateTimeProps {
  navigate: (screen: Screen, data?: any) => void;
  doctor?: any;
}

const dates = [
  { day: 'SEG', date: '18', full: '18 Dez' },
  { day: 'TER', date: '19', full: '19 Dez' },
  { day: 'QUA', date: '20', full: '20 Dez' },
  { day: 'QUI', date: '21', full: '21 Dez' },
  { day: 'SEX', date: '22', full: '22 Dez' },
];

const timeSlots = {
  morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  afternoon: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
};

export function ScheduleDateTime({ navigate, doctor }: ScheduleDateTimeProps) {
  const [selectedDate, setSelectedDate] = useState(dates[0].full);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      navigate('appointment-confirmed', {
        selectedDoctor: doctor,
        selectedDate,
        selectedTime
      });
    }
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Data e Hora"
        onBack={() => navigate('schedule-doctor')}
        showNotification={false}
      />

      <div className="px-6 py-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
        </div>
        
        <div className="mb-6">
          <h2 className="text-[#1A2B48] mb-2">Escolha Data e Hora</h2>
          <p className="text-[#CED6E0]">Passo 3 de 3 • {doctor?.name || 'Médico'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {/* Date Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1A2B48]">Dezembro 2024</h3>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E8F1FF]">
                <ChevronLeft className="w-4 h-4 text-[#1A2B48]" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E8F1FF]">
                <ChevronRight className="w-4 h-4 text-[#1A2B48]" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date) => (
              <button
                key={date.date}
                onClick={() => setSelectedDate(date.full)}
                className={`flex-shrink-0 w-16 py-3 rounded-2xl border-2 transition-all ${
                  selectedDate === date.full
                    ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
                    : 'bg-white border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                <div className="text-xs mb-1">{date.day}</div>
                <div className="text-xl">{date.date}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Morning Time Slots */}
        <div className="mb-6">
          <h3 className="text-[#1A2B48] mb-4">Manhã</h3>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.morning.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`h-12 rounded-xl border-2 transition-all ${
                  selectedTime === time
                    ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
                    : 'bg-white border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Afternoon Time Slots */}
        <div>
          <h3 className="text-[#1A2B48] mb-4">Tarde</h3>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.afternoon.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`h-12 rounded-xl border-2 transition-all ${
                  selectedTime === time
                    ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
                    : 'bg-white border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Button */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-[#E8F1FF]">
        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime}
          className={`w-full h-[52px] rounded-2xl transition-colors ${
            selectedDate && selectedTime
              ? 'bg-[#0A73FF] text-white hover:bg-[#005BEA]'
              : 'bg-[#CED6E0] text-white cursor-not-allowed'
          }`}
        >
          Confirmar Agendamento
        </button>
      </div>
    </div>
  );
}
