import { Home, Pill, MapPin, Bell, User } from 'lucide-react';
import { Screen } from '../../App';

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'home' as Screen, label: 'Início', icon: Home },
    { id: 'medications' as Screen, label: 'Medicamentos', icon: Pill },
    { id: 'postos' as Screen, label: 'Postos', icon: MapPin },
    { id: 'reminders' as Screen, label: 'Lembretes', icon: Bell },
    { id: 'profile' as Screen, label: 'Perfil', icon: User },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E8F1FF] px-4 pb-8 pt-3">
      <div className="flex items-center justify-around">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-[#0A73FF] text-white' : 'text-[#CED6E0]'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-black">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}