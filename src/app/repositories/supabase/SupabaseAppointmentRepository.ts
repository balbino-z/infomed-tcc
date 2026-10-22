import type { SupabaseClient } from '@supabase/supabase-js';
import type { Appointment, AppointmentDraft, AppointmentKind, AppointmentStatus, Doctor, Specialty } from '../../domain/appointment';
import { AppointmentError, type AppointmentRepository } from '../AppointmentRepository';
import { emitNotificationsChanged } from '../../features/notifications/NotificationBus';

interface DoctorRow {
  id: string; name: string; crm: string; specialty_id: string; unit_id: string;
  specialties: { name: string } | { name: string }[] | null;
  health_units: { name: string; opens_at: string; closes_at: string } | { name: string; opens_at: string; closes_at: string }[] | null;
}
interface AppointmentRow {
  id: string; kind: AppointmentKind; starts_at: string; status: AppointmentStatus; cancel_reason: string | null;
  doctor_name: string; crm: string; specialty: string; unit_name: string; unit_address: string;
}

const one = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
const hhmm = (t: string) => t.slice(0, 5);

const toAppointment = (r: AppointmentRow): Appointment => ({
  id: r.id, kind: r.kind, startsAt: r.starts_at, status: r.status, cancelReason: r.cancel_reason,
  doctorName: r.doctor_name, crm: r.crm, specialty: r.specialty, unitName: r.unit_name, unitAddress: r.unit_address,
});

/** Traduz erros do banco (regras do trigger e índices únicos) para mensagens do usuário */
function friendly(err: { message?: string; code?: string }): AppointmentError {
  const msg = err.message ?? '';
  if (err.code === '23505' || msg.includes('duplicate key')) {
    if (msg.includes('no_overlap_per_user')) return new AppointmentError('Você já tem uma consulta nesse horário.');
    return new AppointmentError('Esse horário acabou de ser ocupado. Escolha outro.');
  }
  const known = [
    'O horário precisa estar no futuro', 'Agendamento permitido em até 60 dias', 'A unidade atende de segunda a sexta',
    'Horários de 30 em 30 minutos', 'Horário fora do atendimento da unidade', 'Limite de 5 consultas ativas',
    'Consulta passada não pode ser cancelada',
  ];
  const hit = known.find((k) => msg.includes(k));
  return new AppointmentError(hit ? `${hit}.` : 'Não foi possível concluir. Tente novamente.');
}

export class SupabaseAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listSpecialties(): Promise<Specialty[]> {
    const { data, error } = await this.db.from('specialties').select('id, name, color, doctors(count)').order('name');
    if (error) throw error;
    return (data as unknown as { id: string; name: string; color: string; doctors: { count: number }[] }[])
      .map((s) => ({ id: s.id, name: s.name, color: s.color, doctorCount: s.doctors?.[0]?.count ?? 0 }))
      .filter((s) => s.doctorCount > 0);
  }

  async listDoctors(specialtyId: string): Promise<Doctor[]> {
    const { data, error } = await this.db
      .from('doctors')
      .select('id, name, crm, specialty_id, unit_id, specialties(name), health_units(name, opens_at, closes_at)')
      .eq('specialty_id', specialtyId)
      .order('name');
    if (error) throw error;
    return (data as unknown as DoctorRow[]).map((r) => {
      const unit = one(r.health_units);
      return {
        id: r.id, name: r.name, crm: r.crm, specialtyId: r.specialty_id, specialtyName: one(r.specialties)?.name ?? '',
        unitId: r.unit_id, unitName: unit?.name ?? '', opensAt: hhmm(unit?.opens_at ?? '07:00'), closesAt: hhmm(unit?.closes_at ?? '17:00'),
      };
    });
  }

  async bookedSlots(doctorId: string, from: Date, to: Date): Promise<string[]> {
    const { data, error } = await this.db.rpc('booked_slots', { p_doctor: doctorId, p_from: from.toISOString(), p_to: to.toISOString() });
    if (error) throw error;
    return (data as string[]) ?? [];
  }

  async create(draft: AppointmentDraft): Promise<Appointment> {
    const { data, error } = await this.db
      .from('appointments')
      .insert({ doctor_id: draft.doctorId, starts_at: draft.startsAt, kind: draft.kind })
      .select('id')
      .single();
    if (error) throw friendly(error);
    const created = await this.db.from('my_appointments').select('*').eq('id', (data as { id: string }).id).single();
    if (created.error) throw created.error;
    emitNotificationsChanged();
    return toAppointment(created.data as AppointmentRow);
  }

  async listMine(): Promise<Appointment[]> {
    const { data, error } = await this.db.from('my_appointments').select('*').order('starts_at');
    if (error) throw error;
    return (data as AppointmentRow[]).map(toAppointment);
  }

  async cancel(id: string, reason?: string): Promise<void> {
    const { error } = await this.db.from('appointments').update({ status: 'cancelada', cancel_reason: reason?.trim() || null }).eq('id', id);
    if (error) throw friendly(error);
    emitNotificationsChanged();
  }
}
