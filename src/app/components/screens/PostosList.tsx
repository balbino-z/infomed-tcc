import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { MapPin, Clock, Navigation, SlidersHorizontal, LocateFixed } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { SearchBar } from '../shared/SearchBar';
import { BottomNav } from '../shared/BottomNav';
import type { HealthUnit } from '../../domain/health-unit';
import { healthUnitRepository } from '../../repositories';
import { distanceKm, formatDistance, hoursLabel, isOpenNow } from '../../features/units/unitUtils';
import { useUserLocation } from '../../features/units/useUserLocation';

// O Leaflet só é baixado quando a pessoa abre o mapa
const UnitsMap = lazy(() => import('../../features/units/UnitsMap'));

interface PostosListProps {
  navigate: (screen: Screen, data?: any) => void;
}

export function PostosList({ navigate }: PostosListProps) {
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { location, error: locationError, loading: locating, request } = useUserLocation();

  useEffect(() => {
    healthUnitRepository
      .list()
      .then(setUnits)
      .catch(() => setLoadError('Não foi possível carregar os postos. Verifique sua conexão.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = units.filter((u) => !q || u.name.toLowerCase().includes(q) || u.address.toLowerCase().includes(q));
    if (!location) return filtered.map((u) => ({ unit: u, km: null as number | null }));
    return filtered
      .map((u) => ({ unit: u, km: distanceKm(location, u) as number | null }))
      .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  }, [units, searchQuery, location]);

  const openDetail = (unit: HealthUnit) => navigate('posto-detail', { selectedPosto: unit });

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Postos de Saúde" onBack={() => navigate('home')} onNotification={() => navigate('notifications')} />

      <div className="px-6 py-4 space-y-3">
        <SearchBar placeholder="Buscar posto de saúde..." value={searchQuery} onChange={setSearchQuery} />

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('map-filters')}
            className="flex items-center gap-2 px-4 h-10 bg-white rounded-xl border border-[#E8F1FF] text-[#0A73FF]"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filtros</span>
          </button>

          <button
            onClick={request}
            disabled={locating}
            className="flex items-center gap-2 px-4 h-10 bg-white rounded-xl border border-[#E8F1FF] text-[#0A73FF] disabled:opacity-60"
          >
            <LocateFixed className="w-5 h-5" />
            <span>{locating ? 'Localizando...' : location ? 'Perto de mim ✓' : 'Perto de mim'}</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="flex items-center gap-2 px-4 h-10 bg-[#0A73FF] rounded-xl text-white"
          >
            {viewMode === 'list' ? <MapPin className="w-5 h-5" /> : <span>📋</span>}
            <span>{viewMode === 'list' ? 'Mapa' : 'Lista'}</span>
          </button>
        </div>

        {locationError && <p role="alert" className="text-[#FF4D5E] text-sm">{locationError}</p>}
      </div>

      {loading ? (
        <p className="px-6 text-[#64748B]">Carregando postos...</p>
      ) : loadError ? (
        <p role="alert" className="px-6 text-[#FF4D5E]">{loadError}</p>
      ) : viewMode === 'map' ? (
        <div className="flex-1 relative isolate pb-20">
          <Suspense fallback={<p className="px-6 text-[#64748B]">Carregando mapa...</p>}>
            <UnitsMap units={visible.map((v) => v.unit)} onSelect={openDetail} userLocation={location} />
          </Suspense>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          {visible.length === 0 && <p className="text-[#64748B]">Nenhum posto encontrado.</p>}
          <div className="space-y-3">
            {visible.map(({ unit, km }) => {
              const open = isOpenNow(unit);
              return (
                <button
                  key={unit.id}
                  onClick={() => openDetail(unit)}
                  className="w-full bg-white p-4 rounded-2xl border border-[#E8F1FF] hover:border-[#0A73FF] transition-all text-left"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${open ? 'bg-[#27C183]/10' : 'bg-[#CED6E0]/20'}`}>
                      <MapPin className={`w-6 h-6 ${open ? 'text-[#27C183]' : 'text-[#8A94A6]'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1A2B48] mb-1">{unit.name}</h4>
                      <p className="text-[#64748B] text-sm mb-2">{unit.address}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`flex items-center gap-1 ${open ? 'text-[#27C183]' : 'text-[#8A94A6]'}`}>
                          <Clock className="w-3 h-3" />
                          {hoursLabel(unit)}
                        </span>
                        {km !== null && (
                          <span className="flex items-center gap-1 text-[#0A73FF]">
                            <Navigation className="w-3 h-3" />
                            {formatDistance(km)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-lg text-xs ${open ? 'bg-[#27C183]/10 text-[#27C183]' : 'bg-[#CED6E0]/20 text-[#8A94A6]'}`}>
                      {open ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {unit.services.slice(0, 4).map((service) => (
                      <span key={service} className="px-2 py-1 bg-[#F7FAFF] text-[#0A73FF] text-xs rounded-lg">
                        {service}
                      </span>
                    ))}
                    {unit.services.length > 4 && (
                      <span className="px-2 py-1 text-[#64748B] text-xs">+{unit.services.length - 4}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav active="postos" onNavigate={navigate} />
    </div>
  );
}
