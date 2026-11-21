/**
 * Adesão ao tratamento: doses previstas (lembretes) × doses tomadas (caixa ou botão "Tomei").
 * As mesmas regras estão no banco (db/10_caixa.sql: dose_status, caixa_periodo, _doses_previstas).
 */
export type Period = 'manha' | 'tarde' | 'noite';
export const PERIODS: Period[] = ['manha', 'tarde', 'noite'];
export const PERIOD_LABEL: Record<Period, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

/** Situação gravada no banco quando a dose é registrada. */
export type TakenStatus = 'tomada' | 'atrasada';
/** Situação mostrada no app: tomada ✅ · pendente ⏳ · atrasada ⚠️ (ainda dá para tomar) · esquecida ❌ */
export type DoseStatus = 'tomada' | 'pendente' | 'atrasada' | 'esquecida';
export type DoseSource = 'caixa' | 'app';

export interface DoseEvent {
  reminderId: string;
  scheduledAt: string; // ISO
  status: TakenStatus;
  takenAt: string;
  source: DoseSource;
}

export interface TodayDose {
  reminderId: string;
  label: string;
  time: string; // 'HH:MM'
  period: Period;
  scheduledAt: string;
  status: DoseStatus;
  takenAt: string | null;
  takenLate: boolean;
  source: DoseSource | null;
  canConfirm: boolean; // botão "Tomei" disponível
}

export interface AdherenceSummary {
  days: number;
  expected: number; // doses previstas já encerradas (tomadas ou esquecidas)
  taken: number;
  onTime: number;
  late: number;
  missed: number;
  byDay: { day: string; expected: number; taken: number }[];
  byPeriod: { period: Period; expected: number; taken: number }[];
}

/** Janela de cada dose, em minutos em relação ao horário previsto. */
export const DOSE_WINDOW = { beforeMin: 30, onTimeMin: 30, lateMin: 120 } as const;

/** Antes de 12h = manhã; de 12h às 18h = tarde; depois = noite. */
export function periodOf(time: string): Period {
  if (time < '12:00') return 'manha';
  if (time < '18:00') return 'tarde';
  return 'noite';
}

/** tomada (até 30 min depois) · atrasada (até 2 h) · null = fora da janela */
export function classifyTaken(scheduled: Date, taken: Date): TakenStatus | null {
  const diffMin = (taken.getTime() - scheduled.getTime()) / 60_000;
  if (diffMin < -DOSE_WINDOW.beforeMin) return null;
  if (diffMin <= DOSE_WINDOW.onTimeMin) return 'tomada';
  if (diffMin <= DOSE_WINDOW.lateMin) return 'atrasada';
  return null;
}

export const adherenceRate = (taken: number, expected: number): number | null =>
  expected > 0 ? Math.round((100 * taken) / expected) : null;
