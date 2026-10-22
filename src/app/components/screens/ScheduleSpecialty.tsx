import { useEffect, useState } from 'react';
import { Stethoscope, Baby, HeartPulse, Smile, type LucideIcon } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { SearchBar } from '../shared/SearchBar';
import type { AppointmentKind, Specialty } from '../../domain/appointment';
import { appointmentRepository } from '../../repositories';
import { AppointmentFactory } from '../../features/scheduling/AppointmentFactory';

interface ScheduleSpecialtyProps {
  navigate: (screen: Screen, data?: any) => void;
}

const ICONS: Record<string, LucideIcon> = {
  'Clínico Geral': Stethoscope,
  Pediatria: Baby,
  Ginecologia: HeartPulse,
  Odontologia: Smile,
};

export function ScheduleSpecialty({ navigate }: ScheduleSpecialtyProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [kind, setKind] = useState<AppointmentKind>('consulta');

  useEffect(() => {
    appointmentRepository
      .listSpecialties()
      .then(setSpecialties)
      .catch(() => setError('Não foi possível carregar as especialidades.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = specialties.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Agendar" onBack={() => navigate('home')} showNotification={false} />

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-[#0A73FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#E8F1FF] rounded-full" />
          <div className="flex-1 h-1 bg-[#E8F1FF] rounded-full" />
        </div>

        <div className="mb-4">
          <h2 className="text-[#1A2B48] mb-2">Escolha a Especialidade</h2>
          <p className="text-[#64748B]">Passo 1 de 3</p>
        </div>

        {/* Tipo de agendamento (Factory) */}
        <div className="flex gap-2 mb-4" role="radiogroup" aria-label="Tipo de agendamento">
          {AppointmentFactory.kinds().map((k) => (
            <button
              key={k.kind}
              role="radio"
              aria-checked={kind === k.kind}
              onClick={() => setKind(k.kind)}
              className={`flex-1 h-10 rounded-xl text-sm border-2 transition-all ${
                kind === k.kind ? 'bg-[#0A73FF] border-[#0A73FF] text-white' : 'bg-white border-[#E8F1FF] text-[#1A2B48]'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="text-[#64748B] text-xs mb-4">{AppointmentFactory.rulesFor(kind).description}</p>

        <SearchBar placeholder="Buscar especialidade..." value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {loading && <p className="text-[#64748B]">Carregando...</p>}
        {error && <p role="alert" className="text-[#FF4D5E]">{error}</p>}
        {!loading && !error && filtered.length === 0 && <p className="text-[#64748B]">Nenhuma especialidade encontrada.</p>}

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((specialty) => {
            const Icon = ICONS[specialty.name] ?? Stethoscope;
            return (
              <button
                key={specialty.id}
                onClick={() => navigate('schedule-doctor', { selectedSpecialty: specialty, selectedKind: kind })}
                className="bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${specialty.color}15` }}>
                  <Icon className="w-7 h-7" style={{ color: specialty.color }} />
                </div>
                <h4 className="text-[#1A2B48] mb-2">{specialty.name}</h4>
                <div className="flex items-center gap-1 text-xs text-[#27C183]">
                  <div className="w-2 h-2 bg-[#27C183] rounded-full" />
                  <span>{specialty.doctorCount} {specialty.doctorCount === 1 ? 'médico' : 'médicos'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
