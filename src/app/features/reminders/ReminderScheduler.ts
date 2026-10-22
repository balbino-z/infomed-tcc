import type { Reminder } from '../../domain/reminder';
import { bus, type DueReminder } from '../notifications/NotificationBus';
import { isoDateSP, partsInSP } from '../scheduling/dateUtils';

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Quais lembretes devem tocar agora? (função pura, fácil de testar)
 * Tolera até 2 minutos de atraso, caso o navegador tenha pausado o relógio da aba.
 * `fired` guarda o que já tocou hoje para não repetir.
 */
export function dueReminders(reminders: Reminder[], now: Date, fired: Set<string>): DueReminder[] {
  const p = partsInSP(now);
  const nowMin = p.hour * 60 + p.minute;
  const day = isoDateSP(now);
  const out: DueReminder[] = [];

  for (const r of reminders) {
    if (!r.active || !r.daysOfWeek.includes(p.weekday)) continue;
    for (const time of r.times) {
      const diff = nowMin - toMin(time);
      const key = `${r.id}|${day}|${time}`;
      if (diff >= 0 && diff <= 2 && !fired.has(key)) {
        fired.add(key);
        out.push({ reminderId: r.id, label: r.label, time, note: r.note });
      }
    }
  }
  return out;
}

/** Observer em ação: confere os lembretes a cada 20 s e PUBLICA "reminder-due" no canal. */
export class ReminderScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private reminders: Reminder[] = [];
  private fired = new Set<string>();
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly load: () => Promise<Reminder[]>,
    private readonly intervalMs = 20_000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async refresh() {
    try {
      this.reminders = await this.load();
    } catch {
      /* sem rede: mantém a lista anterior */
    }
  }

  tick() {
    for (const due of dueReminders(this.reminders, this.now(), this.fired)) {
      bus.emit('reminder-due', due);
      // Aviso do sistema (só funciona com o app aberto e permissão concedida)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Hora do remédio', { body: `${due.label} (${due.time})${due.note ? ' - ' + due.note : ''}` });
        } catch {
          /* alguns navegadores móveis exigem service worker; ignora */
        }
      }
    }
  }

  async start() {
    await this.refresh();
    this.unsubscribe = bus.on('reminders-changed', () => void this.refresh());
    this.tick();
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
