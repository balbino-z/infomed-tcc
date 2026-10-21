import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { HealthUnit } from '../../domain/health-unit';
import { isOpenNow, type LatLng } from './unitUtils';

interface UnitsMapProps {
  units: HealthUnit[];
  onSelect?: (unit: HealthUnit) => void;
  userLocation?: LatLng | null;
  /** modo compacto: mapa fixo (sem arrastar/zoom), para usar dentro de telas com rolagem */
  compact?: boolean;
}

// Ícones feitos com HTML/CSS (evita o problema dos ícones padrão do Leaflet com bundlers)
const dot = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:4px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const ICON_OPEN = dot('#27C183');
const ICON_CLOSED = dot('#8A94A6');
const ICON_USER = dot('#0A73FF');

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 16);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
  }, [map, points]);
  return null;
}

export default function UnitsMap({ units, onSelect, userLocation, compact = false }: UnitsMapProps) {
  const points: [number, number][] = units.map((u) => [u.lat, u.lng]);
  if (userLocation) points.push([userLocation.lat, userLocation.lng]);

  return (
    <MapContainer
      center={[-22.7539, -47.4147]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      dragging={!compact}
      scrollWheelZoom={!compact}
      doubleClickZoom={!compact}
      touchZoom={!compact}
      zoomControl={!compact}
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <FitBounds points={points} />

      {units.map((u) => (
        <Marker key={u.id} position={[u.lat, u.lng]} icon={isOpenNow(u) ? ICON_OPEN : ICON_CLOSED}>
          {!compact && (
            <Popup>
              <strong>{u.name}</strong>
              <br />
              <span style={{ fontSize: 12 }}>{u.address}</span>
              <br />
              <button
                onClick={() => onSelect?.(u)}
                style={{ marginTop: 6, color: '#0A73FF', fontWeight: 600, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
              >
                Ver detalhes
              </button>
            </Popup>
          )}
        </Marker>
      ))}

      {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={ICON_USER} />}
    </MapContainer>
  );
}
