import { hasSupabase, supabase } from '../lib/supabase';
import type { AppointmentRepository } from './AppointmentRepository';
import type { AuthRepository } from './AuthRepository';
import type { NotificationRepository } from './NotificationRepository';
import type { ReminderRepository } from './ReminderRepository';
import type { HealthUnitRepository } from './HealthUnitRepository';
import type { MedicationRepository } from './MedicationRepository';
import { MockAppointmentRepository } from './mock/MockAppointmentRepository';
import { MockNotificationRepository } from './mock/MockNotificationRepository';
import { MockReminderRepository } from './mock/MockReminderRepository';
import { MockHealthUnitRepository } from './mock/MockHealthUnitRepository';
import { MockAuthRepository } from './mock/MockAuthRepository';
import { MockMedicationRepository } from './mock/MockMedicationRepository';
import { SupabaseAppointmentRepository } from './supabase/SupabaseAppointmentRepository';
import { SupabaseNotificationRepository } from './supabase/SupabaseNotificationRepository';
import { SupabaseReminderRepository } from './supabase/SupabaseReminderRepository';
import { SupabaseHealthUnitRepository } from './supabase/SupabaseHealthUnitRepository';
import { SupabaseAuthRepository } from './supabase/SupabaseAuthRepository';
import { SupabaseMedicationRepository } from './supabase/SupabaseMedicationRepository';

// ÚNICO lugar onde se escolhe a implementação:
// com .env preenchido usa o Supabase; sem .env usa o Mock (útil em testes e no CI).
export const medicationRepository: MedicationRepository = hasSupabase
  ? new SupabaseMedicationRepository(supabase!)
  : new MockMedicationRepository();

export const authRepository: AuthRepository = hasSupabase
  ? new SupabaseAuthRepository(supabase!)
  : new MockAuthRepository();

export const healthUnitRepository: HealthUnitRepository = hasSupabase
  ? new SupabaseHealthUnitRepository(supabase!)
  : new MockHealthUnitRepository();

export const appointmentRepository: AppointmentRepository = hasSupabase
  ? new SupabaseAppointmentRepository(supabase!)
  : new MockAppointmentRepository();

export const notificationRepository: NotificationRepository = hasSupabase
  ? new SupabaseNotificationRepository(supabase!)
  : new MockNotificationRepository();

export const reminderRepository: ReminderRepository = hasSupabase
  ? new SupabaseReminderRepository(supabase!)
  : new MockReminderRepository();
