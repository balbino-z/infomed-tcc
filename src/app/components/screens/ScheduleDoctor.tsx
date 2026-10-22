import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { SearchBar } from '../shared/SearchBar';
import type { Doctor, Specialty } from '../../domain/appointment';
import { appointmentRepository } from '../../repositories';

interface ScheduleDoctorProps {
  navigate: (screen: Screen, data?: any) => void;
  specialty?: Specialty;
}

export function ScheduleDoctor({ navigate, specialty }: ScheduleDoctorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!specialty) return;
    appointmentRepository
      .listDoctors(specialty.id)
      .then(setDoctors)
      .catch(() => setError('Não foi possível carregar os médicos.'))
      .finally(() => setLoading(false));
  }, [specialty?.id]);

  const filtered = doctors.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.unitName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Escolher Médico" onBack={() => navigate('schedule-specialty')} showNotification={false} />

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#E8F1FF] rounded-full" />
        </div>

        <div className="mb-6">
          <h2 className="text-[#1A2B48] mb-2">Escolha o Médico</h2>
          <p className="text-[#64748B]">Passo 2 de 3 • {specialty?.name}</p>
        </div>

        <SearchBar placeholder="Buscar médico ou unidade..." value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {loading && <p className="text-[#64748B]">Carregando...</p>}
        {error && <p role="alert" className="text-[#FF4D5E]">{error}</p>}
        {!loading && !error && filtered.length === 0 && <p className="text-[#64748B]">Nenhum médico encontrado.</p>}

        <div className="space-y-3">
          {filtered.map((doctor) => (
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
                  <p className="text-[#64748B] text-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{doctor.unitName}</span>
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-[#64748B] text-xs mt-6 text-center">Médicos de demonstração (nomes e registros fictícios).</p>
      </div>
    </div>
  );
}
