import type { Reminder } from '../../domain/reminder';
import {
  classifyTaken, DOSE_WINDOW, PERIODS, periodOf,
  type AdherenceSummary, type DoseEvent, type DoseStatus, type Period, type TodayDose,
} from '../../domain/adherence';
import { isoDateSP, partsInSP, toStartsAt } from '../scheduling/dateUtils';

const MIN = 60_000;

/** Instante previsto da dose: ('2026-11-18', '08:00') -> Date (fuso de São Paulo) */
export const scheduledFor = (isoDate: string, time: string) => new Date(toStartsAt(isoDate, time));

const addDays = (isoDate: string, n: number) => isoDateSP(new Date(scheduledFor(isoDate, '12:00').getTime() + n * 86_400_000));
const weekdayOf = (isoDate: string) => partsInSP(scheduledFor(isoDate, '12:00')).weekday;
const eventKey = (reminderId: string, at: Date | string) => `${reminderId}|${new Date(at).getTime()}`;

export interface ExpectedDose {
  reminder: Reminder;
  day: string;
  time: string;
  period: Period;
  scheduled: Date;
  event: DoseEvent | null;
  status: DoseStatus;
}

/**
 * Doses previstas pelos lembretes ativos entre dois dias (inclusive), cruzadas com as registradas.
 * Mesma regra do banco (_doses_previstas): não depende da caixa estar ligada.
 */
export function expectedDoses(reminders: Reminder[], events: DoseEvent[], fromDay: string, toDay: string, now: Date): ExpectedDose[] {
  const byKey = new Map(events.map((e) => [eventKey(e.reminderId, e.scheduledAt), e]));
  const out: ExpectedDose[] = [];
  for (let day = fromDay; day <= toDay; day = addDays(day, 1)) {
    const weekday = weekdayOf(day);
    for (const r of reminders) {
      if (!r.active || !r.daysOfWeek.includes(weekday)) continue;
      for (const time of r.times) {
        const scheduled = scheduledFor(day, time);
        const event = byKey.get(eventKey(r.id, scheduled)) ?? null;
        // não cobra dose de antes do lembrete existir
        if (!event && r.createdAt) {
          const created = Math.floor(new Date(r.createdAt).getTime() / MIN) * MIN;
          if (scheduled.getTime() < created - DOSE_WINDOW.beforeMin * MIN) continue;
        }
        const elapsedMin = (now.getTime() - scheduled.getTime()) / MIN;
        const status: DoseStatus = event
          ? 'tomada'
          : elapsedMin > DOSE_WINDOW.lateMin ? 'esquecida'
          : elapsedMin > DOSE_WINDOW.onTimeMin ? 'atrasada'
          : 'pendente';
        out.push({ reminder: r, day, time, period: periodOf(time), scheduled, event, status });
      }
    }
  }
  return out;
}

/** Doses de hoje, em ordem de horário, com o selo de cada uma. */
export function todayDoses(reminders: Reminder[], events: DoseEvent[], now: Date): TodayDose[] {
  const today = isoDateSP(now);
  return expectedDoses(reminders, events, today, today, now)
    .map((d): TodayDose => ({
      reminderId: d.reminder.id,
      label: d.reminder.label,
      time: d.time,
      period: d.period,
      scheduledAt: d.scheduled.toISOString(),
      status: d.status,
      takenAt: d.event?.takenAt ?? null,
      takenLate: d.event?.status === 'atrasada',
      source: d.event?.source ?? null,
      canConfirm: !d.event && classifyTaken(d.scheduled, now) !== null,
    }))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.label.localeCompare(b.label));
}

const doseKey = (d: TodayDose) => `${d.reminderId}|${d.scheduledAt}`;

/** Doses que passaram a "tomada" entre duas leituras (para destacar a confirmação que veio da caixa). */
export function newlyTaken(before: TodayDose[], after: TodayDose[]): TodayDose[] {
  const wasTaken = new Set(before.filter((d) => d.status === 'tomada').map(doseKey));
  const known = new Set(before.map(doseKey));
  return after.filter((d) => d.status === 'tomada' && known.has(doseKey(d)) && !wasTaken.has(doseKey(d)));
}

/** Adesão dos últimos `days` dias: só conta doses encerradas (tomadas ou esquecidas). */
export function summarize(reminders: Reminder[], events: DoseEvent[], days: number, now: Date): AdherenceSummary {
  const today = isoDateSP(now);
  const closed = expectedDoses(reminders, events, addDays(today, -(days - 1)), today, now)
    .filter((d) => d.status === 'tomada' || d.status === 'esquecida');

  const byDay = new Map<string, { expected: number; taken: number }>();
  const byPeriod = new Map<Period, { expected: number; taken: number }>();
  for (const d of closed) {
    const taken = d.status === 'tomada' ? 1 : 0;
    const day = byDay.get(d.day) ?? { expected: 0, taken: 0 };
    day.expected++; day.taken += taken;
    byDay.set(d.day, day);
    const p = byPeriod.get(d.period) ?? { expected: 0, taken: 0 };
    p.expected++; p.taken += taken;
    byPeriod.set(d.period, p);
  }

  return {
    days,
    expected: closed.length,
    taken: closed.filter((d) => d.status === 'tomada').length,
    onTime: closed.filter((d) => d.event?.status === 'tomada').length,
    late: closed.filter((d) => d.event?.status === 'atrasada').length,
    missed: closed.filter((d) => d.status === 'esquecida').length,
    byDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v })),
    byPeriod: PERIODS.filter((p) => byPeriod.has(p)).map((period) => ({ period, ...byPeriod.get(period)! })),
  };
}
