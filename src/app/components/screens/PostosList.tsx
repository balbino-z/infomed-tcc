import { useState } from 'react';
import { MapPin, Clock, Navigation, SlidersHorizontal } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { SearchBar } from '../shared/SearchBar';
import { BottomNav } from '../shared/BottomNav';

interface PostosListProps {
  navigate: (screen: Screen, data?: any) => void;
}

const postos = [
  {
    id: 1,
    name: 'UBS Central',
    address: 'Rua das Flores, 123 - Centro',
    distance: '1.2 km',
    status: 'aberto',
    hours: 'Fecha às 17h',
    services: ['Clínico Geral', 'Pediatria', 'Enfermagem']
  },
  {
    id: 2,
    name: 'UBS Vila Nova',
    address: 'Av. Principal, 456 - Vila Nova',
    distance: '2.8 km',
    status: 'aberto',
    hours: 'Fecha às 17h',
    services: ['Clínico Geral', 'Ginecologia', 'Vacinação']
  },
  {
    id: 3,
    name: 'UBS Jardim América',
    address: 'Rua América, 789 - Jardim América',
    distance: '3.5 km',
    status: 'fechado',
    hours: 'Abre às 7h',
    services: ['Clínico Geral', 'Odontologia']
  },
  {
    id: 4,
    name: 'UBS São João',
    address: 'Rua São João, 321 - São João',
    distance: '4.2 km',
    status: 'aberto',
    hours: 'Fecha às 19h',
    services: ['Clínico Geral', 'Cardiologia', 'Psicologia']
  },
];

export function PostosList({ navigate }: PostosListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const filteredPostos = postos.filter(posto =>
    posto.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Postos de Saúde"
        onBack={() => navigate('home')}
        onNotification={() => navigate('notifications')}
      />

      <div className="px-6 py-4 space-y-4">
        <SearchBar
          placeholder="Buscar posto de saúde..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('map-filters')}
            className="flex items-center gap-2 px-4 h-10 bg-white rounded-xl border border-[#E8F1FF] text-[#0A73FF]"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filtros</span>
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="flex items-center gap-2 px-4 h-10 bg-[#0A73FF] rounded-xl text-white"
          >
            {viewMode === 'list' ? <MapPin className="w-5 h-5" /> : <span>📋</span>}
            <span>{viewMode === 'list' ? 'Mapa' : 'Lista'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8F1FF] to-[#F7FAFF] flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-[#0A73FF] mx-auto mb-4" />
              <p className="text-[#64748B]">Visualização do Mapa</p>
              <p className="text-[#64748B] text-sm mt-2">{filteredPostos.length} postos próximos</p>
            </div>
          </div>
          
          {/* Map markers simulation */}
          <div className="absolute top-20 left-20 w-8 h-8 bg-[#0A73FF] rounded-full border-4 border-white shadow-lg" />
          <div className="absolute top-40 right-16 w-8 h-8 bg-[#0A73FF] rounded-full border-4 border-white shadow-lg" />
          <div className="absolute bottom-32 left-16 w-8 h-8 bg-[#CED6E0] rounded-full border-4 border-white shadow-lg" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="space-y-3">
            {filteredPostos.map((posto) => (
              <button
                key={posto.id}
                onClick={() => navigate('posto-detail', { selectedPosto: posto })}
                className="w-full bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all text-left"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    posto.status === 'aberto' ? 'bg-[#27C183]/10' : 'bg-[#CED6E0]/10'
                  }`}>
                    <MapPin className={`w-6 h-6 ${
                      posto.status === 'aberto' ? 'text-[#27C183]' : 'text-[#CED6E0]'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-[#1A2B48] mb-1">{posto.name}</h4>
                    <p className="text-[#64748B] text-sm mb-2">{posto.address}</p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`flex items-center gap-1 ${
                        posto.status === 'aberto' ? 'text-[#27C183]' : 'text-[#CED6E0]'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {posto.hours}
                      </span>
                      <span className="flex items-center gap-1 text-[#0A73FF]">
                        <Navigation className="w-3 h-3" />
                        {posto.distance}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-lg text-xs ${
                    posto.status === 'aberto'
                      ? 'bg-[#27C183]/10 text-[#27C183]'
                      : 'bg-[#CED6E0]/10 text-[#CED6E0]'
                  }`}>
                    {posto.status === 'aberto' ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {posto.services.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-[#F7FAFF] text-[#0A73FF] text-xs rounded-lg"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav active="postos" onNavigate={navigate} />
    </div>
  );
}