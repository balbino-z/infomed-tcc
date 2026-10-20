import { useState } from 'react';
import { X, MapPin, Clock } from 'lucide-react';
import { Screen } from '../../App';

interface MapFiltersProps {
  navigate: (screen: Screen) => void;
}

const services = [
  'Clínico Geral',
  'Pediatria',
  'Ginecologia',
  'Cardiologia',
  'Dermatologia',
  'Ortopedia',
  'Odontologia',
  'Psicologia',
  'Enfermagem',
  'Vacinação',
];

const distances = [
  { id: '1', label: 'Até 1 km' },
  { id: '3', label: 'Até 3 km' },
  { id: '5', label: 'Até 5 km' },
  { id: '10', label: 'Até 10 km' },
];

export function MapFilters({ navigate }: MapFiltersProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDistance, setSelectedDistance] = useState('5');
  const [openNow, setOpenNow] = useState(false);

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleApply = () => {
    // Apply filters and return to postos
    navigate('postos');
  };

  const handleClear = () => {
    setSelectedServices([]);
    setSelectedDistance('5');
    setOpenNow(false);
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 pt-14 pb-4 border-b border-[#E8F1FF]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[#1A2B48]">Filtros</h2>
          <button
            onClick={() => navigate('postos')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F7FAFF]"
          >
            <X className="w-5 h-5 text-[#1A2B48]" />
          </button>
        </div>
        <button
          onClick={handleClear}
          className="text-[#0A73FF] text-sm"
        >
          Limpar filtros
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        {/* Open Now */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27C183]/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#27C183]" />
              </div>
              <div>
                <h3 className="text-[#1A2B48]">Aberto Agora</h3>
                <p className="text-[#CED6E0] text-sm">Mostrar apenas UBS abertas</p>
              </div>
            </div>
            <button
              onClick={() => setOpenNow(!openNow)}
              className={`w-12 h-7 rounded-full transition-all ${
                openNow ? 'bg-[#27C183]' : 'bg-[#CED6E0]'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-all ${
                  openNow ? 'ml-6' : 'ml-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Distance */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0A73FF]/10 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#0A73FF]" />
            </div>
            <h3 className="text-[#1A2B48]">Distância</h3>
          </div>
          
          <div className="space-y-2">
            {distances.map((distance) => (
              <button
                key={distance.id}
                onClick={() => setSelectedDistance(distance.id)}
                className={`w-full h-12 px-4 rounded-xl border-2 transition-all text-left ${
                  selectedDistance === distance.id
                    ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
                    : 'bg-[#F7FAFF] border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                {distance.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
          <h3 className="text-[#1A2B48] mb-4">Serviços Disponíveis</h3>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={service}
                onClick={() => toggleService(service)}
                className={`px-4 py-2 rounded-xl border-2 transition-all ${
                  selectedServices.includes(service)
                    ? 'bg-[#0A73FF] border-[#0A73FF] text-white'
                    : 'bg-[#F7FAFF] border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Actions */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-[#E8F1FF]">
        <button
          onClick={handleApply}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors"
        >
          Aplicar Filtros
          {(selectedServices.length > 0 || openNow) && (
            <span className="ml-2">
              ({selectedServices.length + (openNow ? 1 : 0)})
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
