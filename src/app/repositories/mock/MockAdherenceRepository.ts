import { classifyTaken, type DoseEvent } from '../../domain/adherence';
import type { AdherenceRepository } from '../AdherenceRepository';
import type { ReminderRepository } from '../ReminderRepository';
import { summarize, todayDoses } from '../../features/adherence/doses';
import { emitDosesChanged } from '../../features/notifications/NotificationBus';

// Doses em memória (testes, CI e uso sem .env). Mesmas regras do banco.
const events: DoseEvent[] = [];

export class MockAdherenceRepository implements AdherenceRepository {
  constructor(private readonly reminders: ReminderRepository, private readonly now: () => Date = () => new Date()) {}

  async todayDoses() {
    return todayDoses(await this.reminders.list(), events, this.now());
  }

  async confirmDose(reminderId: string, scheduledAt: string) {
    const scheduled = new Date(scheduledAt);
    const now = this.now();
    const status = classifyTaken(scheduled, now);
    if (!status) throw new Error('Fora da janela da dose (de 30 min antes até 2 h depois)');
    const repeated = events.some((e) => e.reminderId === reminderId && new Date(e.scheduledAt).getTime() === scheduled.getTime());
    if (!repeated) events.push({ reminderId, scheduledAt: scheduled.toISOString(), status, takenAt: now.toISOString(), source: 'app' });
    emitDosesChanged();
  }

  async summary(days: number) {
    if (days < 1 || days > 365) throw new Error('Período deve ser de 1 a 365 dias');
    return summarize(await this.reminders.list(), events, days, this.now());
  }

  /** Só para testes: apaga as doses guardadas. */
  static reset() {
    events.length = 0;
  }
}
