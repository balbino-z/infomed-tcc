import { ChevronLeft, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useUnreadCount } from '../../features/notifications/useUnreadCount';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showNotification?: boolean;
  onNotification?: () => void;
  notificationCount?: number;
}

export function Header({ title, onBack, showNotification = true, onNotification, notificationCount = 0 }: HeaderProps) {
  const nav = useNavigate();
  const location = useLocation();
  const unread = useUnreadCount();
  const count = notificationCount || unread;
  // Se existe uma página anterior dentro do app, volta nela; senão usa o destino indicado pela tela
  const handleBack = () => (location.key !== 'default' ? nav(-1) : onBack?.());

  return (
    <div className="flex items-center justify-between px-6 pt-14 pb-4 bg-white">
      {onBack ? (
        <button 
          onClick={handleBack}
          aria-label="Voltar"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F7FAFF] hover:bg-[#E8F1FF] transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#1A2B48]" />
        </button>
      ) : (
        <div className="w-10" />
      )}
      
      <h1 className="text-[#1A2B48]">{title}</h1>
      
      {showNotification ? (
        <button 
          onClick={onNotification}
          aria-label="Notificações"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F7FAFF] hover:bg-[#E8F1FF] transition-colors relative"
        >
          <Bell className="w-5 h-5 text-[#1A2B48]" />
          {count > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF4D5E] text-white text-[10px] rounded-full flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  );
}
