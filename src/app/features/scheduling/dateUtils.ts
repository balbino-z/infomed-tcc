// Todas as datas do app são mostradas no fuso de São Paulo.
const TZ = 'America/Sao_Paulo';
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export interface SPParts { year: number; month: number; day: number; hour: number; minute: number; weekday: number }

export function partsInSP(d: Date): SPParts {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(d);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? '0';
  return {
    year: Number(get('year')), month: Number(get('month')), day: Number(get('day')),
    hour: Number(get('hour')) % 24, minute: Number(get('minute')),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** '2026-10-23' (data em São Paulo) */
export const isoDateSP = (d: Date) => {
  const p = partsInSP(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
};

/** '28 Dez 2026' */
export const formatDateSP = (iso: string | Date) => {
  const p = partsInSP(typeof iso === 'string' ? new Date(iso) : iso);
  return `${pad(p.day)} ${MONTHS[p.month - 1]} ${p.year}`;
};

/** '14:30' */
export const formatTimeSP = (iso: string | Date) => {
  const p = partsInSP(typeof iso === 'string' ? new Date(iso) : iso);
  return `${pad(p.hour)}:${pad(p.minute)}`;
};

export const monthShort = (iso: string | Date) => MONTHS[partsInSP(typeof iso === 'string' ? new Date(iso) : iso).month - 1].toUpperCase();
export const dayOfMonth = (iso: string | Date) => pad(partsInSP(typeof iso === 'string' ? new Date(iso) : iso).day);

/** Próximos dias úteis (segunda a sexta) a partir de hoje, em São Paulo */
export interface DayOption { iso: string; weekday: string; day: string; label: string }
export function nextBusinessDays(count: number, from = new Date()): DayOption[] {
  const out: DayOption[] = [];
  for (let i = 0; out.length < count && i < count * 3; i++) {
    const d = new Date(from.getTime() + i * 24 * 3600 * 1000);
    const p = partsInSP(d);
    if (p.weekday === 0 || p.weekday === 6) continue;
    out.push({ iso: `${p.year}-${pad(p.month)}-${pad(p.day)}`, weekday: WEEKDAYS[p.weekday], day: pad(p.day), label: `${pad(p.day)} ${MONTHS[p.month - 1]}` });
  }
  return out;
}

/** Monta o instante exato: ('2026-10-23', '10:30') -> '2026-10-23T10:30:00-03:00' */
export const toStartsAt = (isoDate: string, hhmm: string) => `${isoDate}T${hhmm}:00-03:00`;

const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** 'Outubro 2026' a partir de '2026-10-23' */
export const monthYearLabel = (isoDate: string) => {
  const p = partsInSP(new Date(toStartsAt(isoDate, '12:00')));
  return `${FULL_MONTHS[p.month - 1]} ${p.year}`;
};

/** 'Agora', 'Há 5 min', 'Há 3 h', 'Ontem', 'Há 4 dias' */
export function timeAgo(iso: string, now = new Date()): string {
  const diffMin = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffMin < 24 * 60) return `Há ${Math.floor(diffMin / 60)} h`;
  const days = Math.floor(diffMin / (24 * 60));
  return days === 1 ? 'Ontem' : `Há ${days} dias`;
}
