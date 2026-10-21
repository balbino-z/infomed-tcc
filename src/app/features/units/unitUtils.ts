import type { HealthUnit } from '../../domain/health-unit';

const TZ = 'America/Sao_Paulo';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** '07:00' -> '7h' ; '16:30' -> '16h30' */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function nowInSaoPaulo(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return { day: DAYS.indexOf(get('weekday')), minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

// Premissa: UBS atendem de segunda a sexta (a fonte informa só o horário diário).
export function isOpenNow(u: Pick<HealthUnit, 'opensAt' | 'closesAt'>, now = new Date()): boolean {
  const { day, minutes } = nowInSaoPaulo(now);
  if (day === 0 || day === 6) return false;
  return minutes >= toMinutes(u.opensAt) && minutes < toMinutes(u.closesAt);
}

/** Texto curto para a lista: "Fecha às 16h30", "Abre às 7h", "Abre amanhã às 7h", "Abre segunda às 7h" */
export function hoursLabel(u: Pick<HealthUnit, 'opensAt' | 'closesAt'>, now = new Date()): string {
  if (isOpenNow(u, now)) return `Fecha às ${formatTime(u.closesAt)}`;
  const { day, minutes } = nowInSaoPaulo(now);
  const opens = formatTime(u.opensAt);
  const weekday = day >= 1 && day <= 5;
  if (weekday && minutes < toMinutes(u.opensAt)) return `Abre às ${opens}`;
  if (day >= 1 && day <= 4) return `Abre amanhã às ${opens}`;
  return `Abre segunda às ${opens}`;
}

export interface LatLng { lat: number; lng: number }

/** Distância em km (fórmula de Haversine) */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

export const directionsUrl = (u: Pick<HealthUnit, 'lat' | 'lng'>) =>
  `https://www.google.com/maps/dir/?api=1&destination=${u.lat},${u.lng}`;
