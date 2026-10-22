import type { Doctor } from '../../domain/appointment';
import { toStartsAt } from './dateUtils';

export interface Slot {
  time: string;      // 'HH:MM'
  startsAt: string;  // ISO com fuso
  available: boolean;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * Horários de 30 em 30 minutos dentro do atendimento da unidade.
 * `booked` = instantes (em ms) já ocupados; `minStart` = primeiro instante permitido (antecedência mínima).
 */
export function generateDaySlots(
  isoDate: string,
  doctor: Pick<Doctor, 'opensAt' | 'closesAt'>,
  booked: Set<number>,
  minStart: Date,
): Slot[] {
  const slots: Slot[] = [];
  for (let t = toMin(doctor.opensAt); t + 30 <= toMin(doctor.closesAt); t += 30) {
    const startsAt = toStartsAt(isoDate, fmt(t));
    const ms = new Date(startsAt).getTime();
    slots.push({ time: fmt(t), startsAt, available: ms >= minStart.getTime() && !booked.has(ms) });
  }
  return slots;
}
