import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdherenceSummary, DoseEvent } from '../../domain/adherence';
import type { AdherenceRepository } from '../AdherenceRepository';
import type { ReminderRepository } from '../ReminderRepository';
import { todayDoses } from '../../features/adherence/doses';
import { emitDosesChanged } from '../../features/notifications/NotificationBus';

interface EventRow { reminder_id: string; scheduled_at: string; status: DoseEvent['status']; taken_at: string; source: DoseEvent['source'] }

export class SupabaseAdherenceRepository implements AdherenceRepository {
  constructor(private readonly db: SupabaseClient, private readonly reminders: ReminderRepository) {}

  async todayDoses() {
    const since = new Date(Date.now() - 26 * 3_600_000).toISOString();
    const [reminders, events] = await Promise.all([
      this.reminders.list(),
      this.db.from('dose_events').select('reminder_id, scheduled_at, status, taken_at, source').gte('scheduled_at', since),
    ]);
    if (events.error) throw new Error('Não foi possível carregar as doses de hoje.');
    const list = (events.data as EventRow[]).map((e): DoseEvent => ({
      reminderId: e.reminder_id, scheduledAt: e.scheduled_at, status: e.status, takenAt: e.taken_at, source: e.source,
    }));
    return todayDoses(reminders, list, new Date());
  }

  async confirmDose(reminderId: string, scheduledAt: string) {
    const { data, error } = await this.db.rpc('registrar_dose_app', { p_reminder: reminderId, p_scheduled: scheduledAt });
    if (error) throw new Error('Não foi possível registrar a dose.');
    const r = data as { ok: boolean; erro?: string };
    if (!r.ok) throw new Error(r.erro ?? 'Dose recusada.');
    emitDosesChanged();
  }

  async summary(days: number): Promise<AdherenceSummary> {
    const { data, error } = await this.db.rpc('minha_adesao', { p_days: days });
    if (error) throw new Error('Não foi possível calcular a adesão.');
    return data as AdherenceSummary;
  }
}
