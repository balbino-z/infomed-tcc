import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Clock, Pill, ArrowUpDown } from 'lucide-react';
import { Screen } from '../../App';
import type { Medication } from '../../domain/medication';
import { healthUnitRepository, medicationRepository } from '../../repositories';
import { DEFAULT_FILTERS, type UnitFilters } from '../../features/units/filters/types';
import { countActiveFilters } from '../../features/units/filters/applyFilters';

interface MapFiltersProps {
  navigate: (screen: Screen, data?: any) => void;
  filters?: UnitFilters;
}

const DISTANCES: { km: number | null; label: string }[] = [
  { km: null, label: 'Sem limite' },
  { km: 1, label: 'Até 1 km' },
  { km: 3, label: 'Até 3 km' },
  { km: 5, label: 'Até 5 km' },
  { km: 10, label: 'Até 10 km' },
];

const chip = (on: boolean) =>
  `px-4 py-2 rounded-xl border-2 transition-all ${on ? 'bg-[#0A73FF] border-[#0A73FF] text-white' : 'bg-[#F7FAFF] border-[#E8F1FF] text-[#1A2B48]'}`;

export function MapFilters({ navigate, filters = DEFAULT_FILTERS }: MapFiltersProps) {
  const [draft, setDraft] = useState<UnitFilters>(filters);
  const [services, setServices] = useState<string[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Só oferece serviços que realmente existem nas unidades
  useEffect(() => {
    healthUnitRepository.list().then((units) => setServices([...new Set(units.flatMap((u) => u.services))].sort((a, b) => a.localeCompare(b, 'pt-BR')))).catch(() => {});
    medicationRepository.list().then(setMedications).catch(() => {});
  }, []);

  const set = <K extends keyof UnitFilters>(key: K, value: UnitFilters[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleService = (s: string) => set('services', draft.services.includes(s) ? draft.services.filter((x) => x !== s) : [...draft.services, s]);
  const active = useMemo(() => countActiveFilters(draft), [draft]);

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <div className="bg-white px-6 pt-14 pb-4 border-b border-[#E8F1FF]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[#1A2B48]">Filtros</h2>
          <button aria-label="Fechar" onClick={() => navigate('postos')} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F7FAFF]">
            <X className="w-5 h-5 text-[#1A2B48]" />
          </button>
        </div>
        <button onClick={() => setDraft(DEFAULT_FILTERS)} className="text-[#0A73FF] text-sm">Limpar filtros</button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27C183]/10 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-[#27C183]" /></div>
              <div>
                <h3 className="text-[#1A2B48]">Aberto Agora</h3>
                <p className="text-[#64748B] text-sm">Mostrar apenas UBS abertas</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={draft.openNow}
              aria-label="Aberto agora"
              onClick={() => set('openNow', !draft.openNow)}
              className={`w-12 h-7 rounded-full transition-all text-left ${draft.openNow ? 'bg-[#27C183]' : 'bg-[#CED6E0]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${draft.openNow ? 'ml-6' : 'ml-1'}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0A73FF]/10 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-[#0A73FF]" /></div>
            <div>
              <h3 className="text-[#1A2B48]">Distância</h3>
              <p className="text-[#64748B] text-sm">Usa a sua localização, só no aparelho</p>
            </div>
          </div>
          <div className="space-y-2">
            {DISTANCES.map((d) => (
              <button
                key={d.label}
                aria-pressed={draft.maxDistanceKm === d.km}
                onClick={() => set('maxDistanceKm', d.km)}
                className={`w-full h-12 px-4 rounded-xl border-2 transition-all text-left ${draft.maxDistanceKm === d.km ? 'bg-[#0A73FF] border-[#0A73FF] text-white' : 'bg-[#F7FAFF] border-[#E8F1FF] text-[#1A2B48]'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <h3 className="text-[#1A2B48] mb-1">Serviços</h3>
          <p className="text-[#64748B] text-sm mb-4">A unidade precisa oferecer todos os marcados</p>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button key={s} aria-pressed={draft.services.includes(s)} onClick={() => toggleService(s)} className={chip(draft.services.includes(s))}>{s}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#FFCC48]/20 rounded-xl flex items-center justify-center"><Pill className="w-5 h-5 text-[#946C00]" /></div>
            <div>
              <h3 className="text-[#1A2B48]">Medicamento disponível</h3>
              <p className="text-[#64748B] text-sm">Estoque simulado, só para demonstração</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {medications.map((m) => (
              <button
                key={m.id}
                aria-pressed={draft.medicationId === m.id}
                onClick={() => set('medicationId', draft.medicationId === m.id ? null : m.id)}
                className={chip(draft.medicationId === m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#9B59B6]/10 rounded-xl flex items-center justify-center"><ArrowUpDown className="w-5 h-5 text-[#9B59B6]" /></div>
            <h3 className="text-[#1A2B48]">Ordenar por</h3>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Ordenar por">
            {([['name', 'Nome'], ['distance', 'Distância']] as const).map(([value, label]) => (
              <button key={value} role="radio" aria-checked={draft.sort === value} onClick={() => set('sort', value)} className={`flex-1 ${chip(draft.sort === value)}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-[#E8F1FF]">
        <button
          onClick={() => navigate('postos', { unitFilters: draft })}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors"
        >
          Aplicar Filtros{active > 0 ? ` (${active})` : ''}
        </button>
      </div>
    </div>
  );
}
