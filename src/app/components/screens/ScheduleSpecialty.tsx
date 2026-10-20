import { Stethoscope, Heart, Baby, Eye, Brain, Bone } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { SearchBar } from '../shared/SearchBar';
import { useState } from 'react';

interface ScheduleSpecialtyProps {
  navigate: (screen: Screen, data?: any) => void;
}

const specialties = [
  { id: 1, name: 'Clínico Geral', icon: Stethoscope, available: 12, color: '#0A73FF' },
  { id: 2, name: 'Cardiologia', icon: Heart, available: 8, color: '#FF4D5E' },
  { id: 3, name: 'Pediatria', icon: Baby, available: 15, color: '#FFCC48' },
  { id: 4, name: 'Oftalmologia', icon: Eye, available: 6, color: '#27C183' },
  { id: 5, name: 'Neurologia', icon: Brain, available: 4, color: '#9B59B6' },
  { id: 6, name: 'Ortopedia', icon: Bone, available: 10, color: '#E67E22' },
];

export function ScheduleSpecialty({ navigate }: ScheduleSpecialtyProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecialties = specialties.filter(spec =>
    spec.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Agendar Consulta"
        onBack={() => navigate('home')}
        showNotification={false}
      />

      <div className="px-6 py-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#E8F1FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#E8F1FF] rounded-full" />
        </div>
        
        <div className="mb-6">
          <h2 className="text-[#1A2B48] mb-2">Escolha a Especialidade</h2>
          <p className="text-[#CED6E0]">Passo 1 de 3</p>
        </div>

        <SearchBar
          placeholder="Buscar especialidade..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {filteredSpecialties.map((specialty) => {
            const Icon = specialty.icon;
            return (
              <button
                key={specialty.id}
                onClick={() => navigate('schedule-doctor', { selectedSpecialty: specialty.name })}
                className="bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all text-left"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${specialty.color}15` }}
                >
                  <Icon className="w-7 h-7" style={{ color: specialty.color }} />
                </div>
                
                <h4 className="text-[#1A2B48] mb-2">{specialty.name}</h4>
                
                <div className="flex items-center gap-1 text-xs text-[#27C183]">
                  <div className="w-2 h-2 bg-[#27C183] rounded-full" />
                  <span>{specialty.available} disponíveis</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
