import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { SearchBar } from '../shared/SearchBar';
import { BottomNav } from '../shared/BottomNav';

interface MedicationListProps {
  navigate: (screen: Screen, data?: any) => void;
}

const medications = [
  { id: 1, name: 'Losartana Potássica', dosage: '50mg', type: 'Comprimido', status: 'disponivel', description: 'Anti-hipertensivo' },
  { id: 2, name: 'Metformina', dosage: '500mg', type: 'Comprimido', status: 'disponivel', description: 'Antidiabético' },
  { id: 3, name: 'Omeprazol', dosage: '20mg', type: 'Cápsula', status: 'disponivel', description: 'Antiácido' },
  { id: 4, name: 'Sinvastatina', dosage: '20mg', type: 'Comprimido', status: 'atencao', description: 'Hipolipemiante' },
  { id: 5, name: 'Paracetamol', dosage: '750mg', type: 'Comprimido', status: 'disponivel', description: 'Analgésico' },
  { id: 6, name: 'Amoxicilina', dosage: '500mg', type: 'Cápsula', status: 'indisponivel', description: 'Antibiótico' },
];

export function MedicationList({ navigate }: MedicationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-[#27C183]/10 text-[#27C183] border-[#27C183]/20';
      case 'atencao':
        return 'bg-[#FFCC48]/10 text-[#FFCC48] border-[#FFCC48]/20';
      case 'indisponivel':
        return 'bg-[#FF4D5E]/10 text-[#FF4D5E] border-[#FF4D5E]/20';
      default:
        return 'bg-[#CED6E0]/10 text-[#CED6E0] border-[#CED6E0]/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'atencao':
        return 'Estoque Baixo';
      case 'indisponivel':
        return 'Indisponível';
      default:
        return '';
    }
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Medicamentos"
        onBack={() => navigate('home')}
        onNotification={() => navigate('notifications')}
        notificationCount={3}
      />

      <div className="px-6 py-4 space-y-4">
        <SearchBar
          placeholder="Buscar medicamento..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        
        <button className="flex items-center gap-2 text-[#0A73FF]">
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="space-y-3">
          {filteredMedications.map((med) => (
            <button
              key={med.id}
              onClick={() => navigate('medication-detail', { selectedMedication: med })}
              className="w-full bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-[#1A2B48] mb-1">{med.name}</h4>
                  <p className="text-[#64748B] text-sm">{med.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs border ${getStatusColor(med.status)}`}>
                  {getStatusText(med.status)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-[#64748B]">
                <span>{med.dosage}</span>
                <span>•</span>
                <span>{med.type}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav active="medications" onNavigate={navigate} />
    </div>
  );
}