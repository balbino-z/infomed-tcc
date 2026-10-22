import type { NewReminder, Reminder } from '../domain/reminder';

export interface ReminderRepository {
  list(): Promise<Reminder[]>;
  create(input: NewReminder): Promise<Reminder>;
  setActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
}
