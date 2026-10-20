import { useState } from 'react';
import { Pill, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Screen, AppState } from '../../App';
import { SearchBar } from '../shared/SearchBar';
import { BottomNav } from '../shared/BottomNav';
import { useAuth } from '../../features/auth/AuthContext';

interface HomeProps {
  navigate: (screen: Screen, data?: Partial<AppState>) => void;
  appState: AppState;
}

export function Home({ navigate, appState }: HomeProps) {
  const { user } = useAuth();
  const firstName = (user?.fullName || user?.email || 'usuário').split(' ')[0];
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A73FF] to-[#005BEA] px-6 pt-14 pb-8 rounded-b-[32px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm mb-1">Olá,</p>
            <h2 className="text-white">{firstName}</h2>
          </div>
          <button
            onClick={() => navigate('notifications')}
            className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center relative"
          >
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF4D5E] rounded-full" />
            <span className="text-white text-xl">🔔</span>
          </button>
        </div>
        
        <SearchBar
          placeholder="Buscar medicamentos, postos..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-[#1A2B48] mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('medications')}
              className="bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all"
            >
              <div className="w-12 h-12 bg-[#0A73FF]/10 rounded-xl flex items-center justify-center mb-3">
                <Pill className="w-6 h-6 text-[#0A73FF]" />
              </div>
              <p className="text-[#1A2B48] text-sm">Medicamentos</p>
            </button>
            
            <button
              onClick={() => navigate('postos')}
              className="bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#27C183] transition-all"
            >
              <div className="w-12 h-12 bg-[#27C183]/10 rounded-xl flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-[#27C183]" />
              </div>
              <p className="text-[#1A2B48] text-sm">Postos de Saúde</p>
            </button>
            
            <button
              onClick={() => navigate('schedule-specialty')}
              className="bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#FFCC48] transition-all"
            >
              <div className="w-12 h-12 bg-[#FFCC48]/10 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-[#FFCC48]" />
              </div>
              <p className="text-[#1A2B48] text-sm">Agendar Consulta</p>
            </button>
            
            <button
              onClick={() => navigate('history')}
              className="bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all"
            >
              <div className="w-12 h-12 bg-[#0A73FF]/10 rounded-xl flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[#0A73FF]" />
              </div>
              <p className="text-[#1A2B48] text-sm">Histórico</p>
            </button>
          </div>
        </div>

        {/* Próximas Consultas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1A2B48]">Próximas Consultas</h3>
            <button
              onClick={() => navigate('history')}
              className="text-[#0A73FF] text-sm"
            >
              Ver todas
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-[#E8F1FF]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#0A73FF] rounded-xl flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-xs">DEZ</div>
                  <div className="font-medium">28</div>
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-[#1A2B48] mb-1">Dr. Carlos Santos</p>
                <p className="text-[#64748B] text-sm mb-2">Cardiologia</p>
                <div className="flex items-center gap-4 text-sm text-[#64748B]">
                  <span>14:30</span>
                  <span>•</span>
                  <span>UBS Central</span>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-[#CED6E0]" />
            </div>
          </div>
        </div>

        {/* Lembretes de Hoje */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1A2B48]">Lembretes de Hoje</h3>
            <button
              onClick={() => navigate('reminders')}
              className="text-[#0A73FF] text-sm"
            >
              Ver todos
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-[#E8F1FF] flex items-center gap-4">
              <div className="w-3 h-3 bg-[#27C183] rounded-full" />
              <div className="flex-1">
                <p className="text-[#1A2B48]">Losartana 50mg</p>
                <p className="text-[#64748B] text-sm">08:00 - Antes do café</p>
              </div>
              <span className="text-[#27C183] text-sm">Tomado</span>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-[#FFCC48] flex items-center gap-4">
              <div className="w-3 h-3 bg-[#FFCC48] rounded-full animate-pulse" />
              <div className="flex-1">
                <p className="text-[#1A2B48]">Metformina 500mg</p>
                <p className="text-[#64748B] text-sm">14:00 - Após o almoço</p>
              </div>
              <span className="text-[#FFCC48] text-sm">Pendente</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active={appState.currentScreen} onNavigate={navigate} />
    </div>
  );
}