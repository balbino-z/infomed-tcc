import { Bell } from 'lucide-react';
import { Screen } from '../../App';

interface Onboarding3Props {
  navigate: (screen: Screen) => void;
}

export function Onboarding3({ navigate }: Onboarding3Props) {
  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col px-8">
      <div className="flex items-center justify-end pt-14 pb-8">
        <button
          onClick={() => navigate('login')}
          className="text-[#0A73FF]"
        >
          Pular
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-64 h-64 bg-gradient-to-br from-[#FFCC48]/10 to-[#FFCC48]/20 rounded-[40px] flex items-center justify-center mb-12">
          <Bell className="w-32 h-32 text-[#FFCC48]" />
        </div>
        
        <h2 className="text-[#1A2B48] text-center mb-4">
          Lembretes de Medicação
        </h2>
        <p className="text-[#64748B] text-center max-w-[300px] leading-relaxed">
          Configure lembretes para nunca esquecer de tomar seus medicamentos
        </p>
      </div>
      
      <div className="pb-12 space-y-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 bg-[#CED6E0] rounded-full" />
          <div className="w-2 h-2 bg-[#CED6E0] rounded-full" />
          <div className="w-8 h-2 bg-[#0A73FF] rounded-full" />
        </div>
        
        <button
          onClick={() => navigate('login')}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors"
        >
          Começar
        </button>
      </div>
    </div>
  );
}