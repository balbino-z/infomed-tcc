import type { Appointment, AppointmentDraft, Doctor, Specialty } from '../domain/appointment';

export interface AppointmentRepository {
  listSpecialties(): Promise<Specialty[]>;
  listDoctors(specialtyId: string): Promise<Doctor[]>;
  /** Horários (ISO) já ocupados de um médico no período. Não revela quem marcou. */
  bookedSlots(doctorId: string, from: Date, to: Date): Promise<string[]>;
  create(draft: AppointmentDraft): Promise<Appointment>;
  listMine(): Promise<Appointment[]>;
  cancel(id: string, reason?: string): Promise<void>;
}

/** Erros de regra de negócio com mensagem pronta para o usuário */
export class AppointmentError extends Error {}
