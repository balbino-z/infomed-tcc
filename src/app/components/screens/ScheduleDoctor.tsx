import { Star } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { SearchBar } from '../shared/SearchBar';
import { useState } from 'react';

interface ScheduleDoctorProps {
  navigate: (screen: Screen, data?: any) => void;
  specialty?: string;
}

const doctors = [
  {
    id: 1,
    name: 'Dr. Carlos Santos',
    specialty: 'Cardiologia',
    crm: 'CRM 12345-SP',
    rating: 4.8,
    reviews: 124,
    nextAvailable: 'Hoje, 14:30',
    location: 'UBS Central'
  },
  {
    id: 2,
    name: 'Dra. Ana Paula Lima',
    specialty: 'Cardiologia',
    crm: 'CRM 67890-SP',
    rating: 4.9,
    reviews: 156,
    nextAvailable: 'Amanhã, 09:00',
    location: 'UBS Vila Nova'
  },
  {
    id: 3,
    name: 'Dr. Roberto Silva',
    specialty: 'Cardiologia',
    crm: 'CRM 54321-SP',
    rating: 4.7,
    reviews: 98,
    nextAvailable: 'Amanhã, 15:00',
    location: 'UBS Central'
  },
];

export function ScheduleDoctor({ navigate, specialty }: ScheduleDoctorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Escolher Médico"
        onBack={() => navigate('schedule-specialty')}
        showNotification={false}
      />

      <div className="px-6 py-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#E8F1FF] rounded-full" />
        </div>
        
        <div className="mb-6">
          <h2 className="text-[#1A2B48] mb-2">Escolha o Médico</h2>
          <p className="text-[#64748B]">Passo 2 de 3 • {specialty || 'Especialidade'}</p>
        </div>

        <SearchBar
          placeholder="Buscar médico..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="space-y-3">
          {filteredDoctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => navigate('schedule-datetime', { selectedDoctor: doctor })}
              className="w-full bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0A73FF] to-[#005BEA] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                  <span className="text-xl">👨‍⚕️</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#1A2B48] mb-1">{doctor.name}</h4>
                  <p className="text-[#64748B] text-sm mb-2">{doctor.crm}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#FFCC48] text-[#FFCC48]" />
                      <span className="text-[#1A2B48] text-sm">{doctor.rating}</span>
                    </div>
                    <span className="text-[#64748B] text-sm">({doctor.reviews} avaliações)</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[#27C183]">📅 {doctor.nextAvailable}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[#64748B] text-sm">📍 {doctor.location}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}