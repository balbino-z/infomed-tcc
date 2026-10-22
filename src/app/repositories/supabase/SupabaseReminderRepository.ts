import type { SupabaseClient } from '@supabase/supabase-js';
import type { NewReminder, Reminder } from '../../domain/reminder';
import type { ReminderRepository } from '../ReminderRepository';
import { emitRemindersChanged } from '../../features/notifications/NotificationBus';

interface Row { id: string; label: string | null; medication_id: string | null; times: string[]; days_of_week: number[]; note: string | null; active: boolean }

const toDomain = (r: Row): Reminder => ({
  id: r.id, label: r.label ?? '', medicationId: r.medication_id, times: r.times, daysOfWeek: r.days_of_week, note: r.note, active: r.active,
});

export class SupabaseReminderRepository implements ReminderRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list() {
    const { data, error } = await this.db.from('reminders').select('*').order('created_at');
    if (error) throw error;
    return (data as Row[]).map(toDomain);
  }

  async create(input: NewReminder) {
    const { data, error } = await this.db
      .from('reminders')
      .insert({
        label: input.label.trim(), medication_id: input.medicationId, times: input.times,
        days_of_week: input.daysOfWeek, note: input.note?.trim() || null, active: input.active ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;
    emitRemindersChanged();
    return toDomain(data as Row);
  }

  async setActive(id: string, active: boolean) {
    const { error } = await this.db.from('reminders').update({ active }).eq('id', id);
    if (error) throw error;
    emitRemindersChanged();
  }

  async remove(id: string) {
    const { error } = await this.db.from('reminders').delete().eq('id', id);
    if (error) throw error;
    emitRemindersChanged();
  }
}
