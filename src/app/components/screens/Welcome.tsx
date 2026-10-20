import { Pill } from 'lucide-react';
import { Screen } from '../../App';

interface WelcomeProps {
  navigate: (screen: Screen) => void;
}

export function Welcome({ navigate }: WelcomeProps) {
  return (
    <div className="h-full bg-gradient-to-br from-[#0A73FF] to-[#005BEA] flex flex-col items-center justify-between px-8 pt-20 pb-12">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-lg">
          <Pill className="w-12 h-12 text-[#0A73FF]" />
        </div>
        
        <h1 className="text-white text-center mb-3">InfoMed</h1>
        <p className="text-white/90 text-center max-w-[280px]">
          Sistema de Informação de Medicamentos
        </p>
      </div>
      
      <button
        onClick={() => navigate('onboarding1')}
        className="w-full h-[52px] bg-white text-[#0A73FF] rounded-2xl hover:bg-white/95 transition-colors shadow-lg"
      >
        Começar
      </button>
    </div>
  );
}
