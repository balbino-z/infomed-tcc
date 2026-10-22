import type { Appointment, AppointmentDraft, Doctor, Specialty } from '../../domain/appointment';
import { AppointmentError, type AppointmentRepository } from '../AppointmentRepository';
import { emitNotificationsChanged } from '../../features/notifications/NotificationBus';

const SPECIALTIES: Omit<Specialty, 'doctorCount'>[] = [
  { id: 's1', name: 'Clínico Geral', color: '#0A73FF' },
  { id: 's2', name: 'Pediatria', color: '#FFCC48' },
];

const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dra. Fernanda Rocha', crm: 'SIM-0001', specialtyId: 's1', specialtyName: 'Clínico Geral', unitId: 'u1', unitName: 'UBS Exemplo Centro', opensAt: '07:00', closesAt: '16:30' },
  { id: 'd2', name: 'Dr. Paulo Menezes', crm: 'SIM-0002', specialtyId: 's1', specialtyName: 'Clínico Geral', unitId: 'u2', unitName: 'UBS Exemplo Norte', opensAt: '07:00', closesAt: '19:00' },
  { id: 'd3', name: 'Dra. Juliana Prado', crm: 'SIM-0003', specialtyId: 's2', specialtyName: 'Pediatria', unitId: 'u1', unitName: 'UBS Exemplo Centro', opensAt: '07:00', closesAt: '16:30' },
];

// Memória compartilhada durante a sessão (some ao recarregar a página)
const store: Appointment[] = [];
const bookedBy = new Map<string, string>(); // `${doctorId}|${ms}` -> id

export class MockAppointmentRepository implements AppointmentRepository {
  async listSpecialties() {
    return SPECIALTIES.map((s) => ({ ...s, doctorCount: DOCTORS.filter((d) => d.specialtyId === s.id).length }));
  }
  async listDoctors(specialtyId: string) {
    return DOCTORS.filter((d) => d.specialtyId === specialtyId);
  }
  async bookedSlots(doctorId: string, from: Date, to: Date) {
    return [...bookedBy.keys()]
      .filter((k) => k.startsWith(`${doctorId}|`))
      .map((k) => Number(k.split('|')[1]))
      .filter((ms) => ms >= from.getTime() && ms < to.getTime())
      .map((ms) => new Date(ms).toISOString());
  }
  async create(draft: AppointmentDraft) {
    const doctor = DOCTORS.find((d) => d.id === draft.doctorId);
    if (!doctor) throw new AppointmentError('Médico inválido.');
    const key = `${draft.doctorId}|${new Date(draft.startsAt).getTime()}`;
    if (bookedBy.has(key)) throw new AppointmentError('Esse horário acabou de ser ocupado. Escolha outro.');
    const appt: Appointment = {
      id: `a${store.length + 1}`, kind: draft.kind, startsAt: draft.startsAt, status: 'agendada', cancelReason: null,
      doctorName: doctor.name, crm: doctor.crm, specialty: doctor.specialtyName, unitName: doctor.unitName, unitAddress: 'Endereço de exemplo',
    };
    store.push(appt);
    bookedBy.set(key, appt.id);
    emitNotificationsChanged();
    return appt;
  }
  async listMine() {
    return [...store].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  async cancel(id: string, reason?: string) {
    const a = store.find((x) => x.id === id);
    if (!a) throw new AppointmentError('Consulta não encontrada.');
    a.status = 'cancelada';
    a.cancelReason = reason ?? null;
    for (const [k, v] of bookedBy) if (v === id) bookedBy.delete(k);
    emitNotificationsChanged();
  }
}
