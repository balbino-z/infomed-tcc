import type { NewReminder, Reminder } from '../../domain/reminder';
import type { ReminderRepository } from '../ReminderRepository';
import { emitRemindersChanged } from '../../features/notifications/NotificationBus';

const items: Reminder[] = [];
let seq = 0;

export class MockReminderRepository implements ReminderRepository {
  async list() {
    return [...items];
  }
  async create(input: NewReminder) {
    const r: Reminder = { id: `r${++seq}`, active: true, ...input };
    items.push(r);
    emitRemindersChanged();
    return r;
  }
  async setActive(id: string, active: boolean) {
    const r = items.find((x) => x.id === id);
    if (r) r.active = active;
    emitRemindersChanged();
  }
  async remove(id: string) {
    const i = items.findIndex((x) => x.id === id);
    if (i >= 0) items.splice(i, 1);
    emitRemindersChanged();
  }
}
