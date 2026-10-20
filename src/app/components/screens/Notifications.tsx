import { Bell, Calendar, Pill, MapPin, AlertCircle } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';

interface NotificationsProps {
  navigate: (screen: Screen) => void;
}

const notifications = [
  {
    id: 1,
    type: 'appointment',
    icon: Calendar,
    color: '#0A73FF',
    title: 'Lembrete de Consulta',
    message: 'Sua consulta com Dr. Carlos Santos é amanhã às 14:30',
    time: 'Há 2 horas',
    unread: true
  },
  {
    id: 2,
    type: 'medication',
    icon: Pill,
    color: '#27C183',
    title: 'Hora do Medicamento',
    message: 'Não esqueça de tomar Losartana 50mg',
    time: 'Há 3 horas',
    unread: true
  },
  {
    id: 3,
    type: 'posto',
    icon: MapPin,
    color: '#FFCC48',
    title: 'Medicamento Disponível',
    message: 'Metformina está disponível na UBS Central',
    time: 'Ontem',
    unread: false
  },
  {
    id: 4,
    type: 'alert',
    icon: AlertCircle,
    color: '#FF4D5E',
    title: 'Estoque Baixo',
    message: 'Sinvastatina com estoque baixo nas UBS próximas',
    time: 'Há 2 dias',
    unread: false
  },
  {
    id: 5,
    type: 'appointment',
    icon: Calendar,
    color: '#27C183',
    title: 'Consulta Confirmada',
    message: 'Sua consulta foi confirmada para 28/12',
    time: 'Há 3 dias',
    unread: false
  },
];

export function Notifications({ navigate }: NotificationsProps) {
  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Notificações"
        onBack={() => navigate('home')}
        showNotification={false}
      />

      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[#64748B] text-sm">
            {notifications.filter(n => n.unread).length} não lidas
          </p>
          <button className="text-[#0A73FF] text-sm">
            Marcar todas como lidas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                className={`bg-white p-4 rounded-2xl border transition-all ${
                  notif.unread
                    ? 'border-[#0A73FF] shadow-sm'
                    : 'border-[#E8F1FF]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${notif.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: notif.color }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-[#1A2B48]">{notif.title}</h4>
                      {notif.unread && (
                        <div className="w-2 h-2 bg-[#0A73FF] rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[#64748B] text-sm mb-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[#64748B] text-xs">{notif.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}