import { Bell, Clock, Plus, MoreVertical } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { BottomNav } from '../shared/BottomNav';

interface RemindersListProps {
  navigate: (screen: Screen) => void;
  reminders?: any[];
}

const defaultReminders = [
  {
    id: 1,
    medication: 'Losartana 50mg',
    time: '08:00',
    frequency: 'Todos os dias',
    note: 'Antes do café da manhã',
    active: true
  },
  {
    id: 2,
    medication: 'Metformina 500mg',
    time: '14:00',
    frequency: 'Todos os dias',
    note: 'Após o almoço',
    active: true
  },
  {
    id: 3,
    medication: 'Omeprazol 20mg',
    time: '20:00',
    frequency: 'Todos os dias',
    note: 'Antes do jantar',
    active: true
  },
  {
    id: 4,
    medication: 'Sinvastatina 20mg',
    time: '22:00',
    frequency: 'Todos os dias',
    note: 'Antes de dormir',
    active: false
  },
];

export function RemindersList({ navigate, reminders: propReminders }: RemindersListProps) {
  // Use os lembretes recebidos via props, senão use os padrões
  const reminders = propReminders && propReminders.length > 0 ? propReminders : defaultReminders;
  
  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Lembretes"
        onBack={() => navigate('home')}
        onNotification={() => navigate('notifications')}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white p-4 rounded-2xl border transition-all ${
                reminder.active ? 'border-[#E8F1FF]' : 'border-[#CED6E0]/30 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-[rgb(3,5,9)]">{reminder.medication}</h4>
                    <button className="w-8 h-8 flex items-center justify-center">
                      <MoreVertical className="w-5 h-5 text-[#CED6E0]" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-[#64748B] mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-[rgb(33,39,47)]">{reminder.time}</span>
                    </div>
                    <span>•</span>
                    <span className="text-[rgb(0,0,0)]">{reminder.frequency}</span>
                  </div>
                  
                  {reminder.note && (
                    <p className="text-[rgb(11,12,15)] text-sm">{reminder.note}</p>
                  )}
                </div>
                
                <button
                  className={`w-12 h-7 rounded-full transition-all ${
                    reminder.active ? 'bg-[#27C183]' : 'bg-[#CED6E0]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-all ${
                      reminder.active ? 'ml-6' : 'ml-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {reminders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#F7FAFF] rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-[#CED6E0]" />
            </div>
            <p className="text-[#64748B] text-center mb-2">
              Nenhum lembrete configurado
            </p>
            <p className="text-[#64748B] text-sm text-center max-w-[250px]">
              Adicione lembretes para não esquecer de tomar seus medicamentos
            </p>
          </div>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => navigate('create-reminder')}
        className="absolute bottom-24 right-6 w-14 h-14 bg-[#0A73FF] text-white rounded-2xl shadow-lg hover:bg-[#005BEA] transition-all flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav active="reminders" onNavigate={navigate} />
    </div>
  );
}