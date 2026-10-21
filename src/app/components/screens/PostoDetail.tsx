import { lazy, Suspense, useEffect, useState } from 'react';
import { MapPin, Clock, Phone, Navigation, Calendar } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import type { HealthUnit, UnitMedication } from '../../domain/health-unit';
import type { StockStatus } from '../../domain/medication';
import { healthUnitRepository } from '../../repositories';
import { directionsUrl, formatTime, isOpenNow } from '../../features/units/unitUtils';

const UnitsMap = lazy(() => import('../../features/units/UnitsMap'));

interface PostoDetailProps {
  navigate: (screen: Screen, data?: any) => void;
  posto?: HealthUnit;
}

const STATUS_STYLE: Record<StockStatus, { label: string; cls: string }> = {
  disponivel: { label: 'Disponível', cls: 'bg-[#27C183]/10 text-[#1E9A68]' },
  atencao: { label: 'Estoque baixo', cls: 'bg-[#FFCC48]/20 text-[#946C00]' },
  indisponivel: { label: 'Indisponível', cls: 'bg-[#FF4D5E]/10 text-[#D93A4A]' },
};

export function PostoDetail({ navigate, posto }: PostoDetailProps) {
  const [meds, setMeds] = useState<UnitMedication[] | null>(null);
  const [medsError, setMedsError] = useState(false);

  useEffect(() => {
    if (!posto) return;
    setMeds(null);
    setMedsError(false);
    healthUnitRepository.listMedications(posto.id).then(setMeds).catch(() => setMedsError(true));
  }, [posto?.id]);

  if (!posto) {
    return (
      <div className="h-full bg-[#F7FAFF] flex items-center justify-center">
        <p className="text-[#64748B]">Posto não encontrado</p>
      </div>
    );
  }

  const open = isOpenNow(posto);

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Detalhes do Posto" onBack={() => navigate('postos')} onNotification={() => navigate('notifications')} />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Mapa */}
        <div className="h-48 relative isolate bg-[#E8F1FF]">
          <Suspense fallback={<div className="h-full flex items-center justify-center text-[#64748B]">Carregando mapa...</div>}>
            <UnitsMap units={[posto]} compact />
          </Suspense>
          <a
            href={directionsUrl(posto)}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 z-[1000] px-4 py-2 bg-white rounded-xl text-[#0A73FF] text-sm shadow-lg flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Como chegar
          </a>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${open ? 'bg-[#27C183]/10' : 'bg-[#CED6E0]/20'}`}>
                <MapPin className={`w-7 h-7 ${open ? 'text-[#27C183]' : 'text-[#8A94A6]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[#1A2B48] mb-1">{posto.name}</h2>
                <span className={`inline-block px-3 py-1 text-xs rounded-lg ${open ? 'bg-[#27C183]/10 text-[#27C183]' : 'bg-[#CED6E0]/20 text-[#64748B]'}`}>
                  {open ? 'Aberto agora' : 'Fechado agora'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#64748B] mt-0.5 shrink-0" />
                <p className="text-[#1A2B48]">{posto.address}</p>
              </div>
              {posto.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#64748B] shrink-0" />
                  <a href={`tel:${posto.phone.replace(/[^\d+]/g, '')}`} className="text-[#0A73FF]">
                    {posto.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <h3 className="text-[#1A2B48] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#64748B]" />
              Horário de Funcionamento
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Segunda a Sexta</span>
              <span className="text-[#1A2B48]">
                {formatTime(posto.opensAt)} às {formatTime(posto.closesAt)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <h3 className="text-[#1A2B48] mb-4">Serviços Disponíveis</h3>
            <div className="space-y-3">
              {posto.services.map((service) => (
                <div key={service} className="flex items-center gap-3 p-3 bg-[#F7FAFF] rounded-xl">
                  <div className="w-2 h-2 bg-[#27C183] rounded-full" />
                  <span className="text-[#1A2B48]">{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <h3 className="text-[#1A2B48] mb-4">Medicamentos</h3>

            {medsError ? (
              <p role="alert" className="text-[#FF4D5E] text-sm">Não foi possível carregar os medicamentos.</p>
            ) : meds === null ? (
              <p className="text-[#64748B] text-sm">Carregando...</p>
            ) : meds.length === 0 ? (
              <p className="text-[#64748B] text-sm">Esta unidade não tem farmácia na lista de serviços informada pela Prefeitura.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {meds.map((m) => (
                  <span key={m.medicationId} className={`px-3 py-2 text-sm rounded-xl ${STATUS_STYLE[m.status].cls}`}>
                    {m.name} {m.dosage} · {STATUS_STYLE[m.status].label}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[#64748B] text-xs mt-4">
              Disponibilidade simulada, apenas para demonstração acadêmica. Confirme com a unidade.
            </p>
            <button onClick={() => navigate('medications')} className="w-full mt-3 text-[#0A73FF] text-center">
              Ver lista completa
            </button>
          </div>

          <p className="text-[#64748B] text-xs text-center">
            Dados das unidades: Prefeitura de Santa Bárbara d'Oeste. Mapa: © OpenStreetMap.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-t border-[#E8F1FF]">
        <button
          onClick={() => navigate('schedule-specialty')}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Agendar Consulta
        </button>
      </div>
    </div>
  );
}
