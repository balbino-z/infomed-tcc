import { Search } from 'lucide-react';
import { Screen } from '../../App';

interface Onboarding1Props {
  navigate: (screen: Screen) => void;
}

export function Onboarding1({ navigate }: Onboarding1Props) {
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
        <div className="w-64 h-64 bg-gradient-to-br from-[#0A73FF]/10 to-[#005BEA]/10 rounded-[40px] flex items-center justify-center mb-12">
          <Search className="w-32 h-32 text-[#0A73FF]" />
        </div>
        
        <h2 className="text-[#1A2B48] text-center mb-4">
          Encontre Medicamentos
        </h2>
        <p className="text-[#64748B] text-center max-w-[300px] leading-relaxed">
          Busque informações completas sobre medicamentos disponíveis no SUS
        </p>
      </div>
      
      <div className="pb-12 space-y-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-2 bg-[#0A73FF] rounded-full" />
          <div className="w-2 h-2 bg-[#CED6E0] rounded-full" />
          <div className="w-2 h-2 bg-[#CED6E0] rounded-full" />
        </div>
        
        <button
          onClick={() => navigate('onboarding2')}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}