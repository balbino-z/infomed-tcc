import type { Appointment, AppointmentKind, Doctor, Specialty } from '../../domain/appointment';
import type { HealthUnit } from '../../domain/health-unit';

export type Screen =
  | 'welcome'
  | 'onboarding1'
  | 'onboarding2'
  | 'onboarding3'
  | 'login'
  | 'signup'
  | 'home'
  | 'medications'
  | 'medication-detail'
  | 'postos'
  | 'posto-detail'
  | 'schedule-specialty'
  | 'schedule-doctor'
  | 'schedule-datetime'
  | 'appointment-confirmed'
  | 'cancel-appointment'
  | 'notifications'
  | 'history'
  | 'reminders'
  | 'create-reminder'
  | 'map-filters'
  | 'profile';

// Dados que passam de uma tela para outra (ex.: o posto escolhido)
export interface AppState {
  currentScreen: Screen;
  selectedMedication?: any;
  selectedPosto?: HealthUnit;
  // fluxo de agendamento
  selectedKind?: AppointmentKind;
  selectedSpecialty?: Specialty;
  selectedDoctor?: Doctor;
  selectedAppointment?: Appointment; // consulta escolhida para cancelar
  lastBooked?: Appointment;          // consulta recém-agendada
}
