export interface Reminder {
  id: string;
  label: string;               // ex.: 'Losartana 50mg'
  medicationId: string | null;
  times: string[];             // ['08:00', '20:00']
  daysOfWeek: number[];        // 0 = domingo ... 6 = sábado
  note: string | null;
  active: boolean;
  createdAt?: string;          // ISO; a adesão não cobra doses de antes do lembrete existir
}

export type NewReminder = Omit<Reminder, 'id' | 'active' | 'createdAt'> & { active?: boolean };

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];
export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function describeDays(days: number[]): string {
  const d = [...days].sort();
  if (d.length === 7) return 'Todos os dias';
  if (d.join() === WEEKDAYS_ONLY.join()) return 'Segunda a sexta';
  return d.map((x) => DAY_NAMES[x]).join(', ');
}
