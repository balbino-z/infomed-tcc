import { ChevronLeft, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showNotification?: boolean;
  onNotification?: () => void;
  notificationCount?: number;
}

export function Header({ title, onBack, showNotification = true, onNotification, notificationCount = 0 }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 pt-14 pb-4 bg-white">
      {onBack ? (
        <button 
          onClick={onBack}
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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F7FAFF] hover:bg-[#E8F1FF] transition-colors relative"
        >
          <Bell className="w-5 h-5 text-[#1A2B48]" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF4D5E] text-white text-[10px] rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  );
}
