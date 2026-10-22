export type AppointmentKind = 'consulta' | 'retorno' | 'exame';
export type AppointmentStatus = 'agendada' | 'cancelada' | 'concluida';

export interface Specialty {
  id: string;
  name: string;
  color: string;
  doctorCount: number;
}

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  specialtyId: string;
  specialtyName: string;
  unitId: string;
  unitName: string;
  opensAt: string;  // 'HH:MM' (horário da unidade)
  closesAt: string;
}

// Pedido de agendamento (criado pela AppointmentFactory)
export interface AppointmentDraft {
  kind: AppointmentKind;
  doctorId: string;
  startsAt: string; // ISO com fuso, ex.: 2026-10-23T10:00:00-03:00
}

export interface Appointment {
  id: string;
  kind: AppointmentKind;
  startsAt: string; // ISO
  status: AppointmentStatus;
  cancelReason: string | null;
  doctorName: string;
  crm: string;
  specialty: string;
  unitName: string;
  unitAddress: string;
}
