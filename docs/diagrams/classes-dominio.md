# Diagrama de classes do domínio

Entidades em `src/app/domain/` e os repositórios que as fornecem (`src/app/repositories/`). Cada repositório tem uma implementação Mock e uma Supabase (padrão Repository, ADR-003).

```mermaid
classDiagram
  direction LR

  class Medication {
    +id: string
    +name: string
    +dosage: string
    +type: string
    +status: StockStatus
    +description: string
  }
  class HealthUnit {
    +id: string
    +name: string
    +address: string
    +lat: number
    +lng: number
    +opensAt: string
    +closesAt: string
    +services: string[]
    +phone: string
    +notes: string
    +verified: boolean
  }
  class UnitMedication {
    +medicationId: string
    +name: string
    +dosage: string
    +form: string
    +status: StockStatus
  }
  class Specialty {
    +id: string
    +name: string
    +color: string
    +doctorCount: number
  }
  class Doctor {
    +id: string
    +name: string
    +crm: string
    +specialtyName: string
    +unitName: string
    +opensAt: string
    +closesAt: string
  }
  class Appointment {
    +id: string
    +kind: AppointmentKind
    +startsAt: string
    +status: AppointmentStatus
    +cancelReason: string
    +doctorName: string
    +specialty: string
    +unitName: string
  }
  class AppointmentDraft {
    +kind: AppointmentKind
    +doctorId: string
    +startsAt: string
  }
  class Reminder {
    +id: string
    +label: string
    +medicationId: string
    +times: string[]
    +daysOfWeek: number[]
    +note: string
    +active: boolean
  }
  class AppNotification {
    +id: string
    +type: NotificationType
    +title: string
    +body: string
    +readAt: string
    +createdAt: string
  }
  class AuthUser {
    +id: string
    +email: string
    +fullName: string
  }
  class UserProfile {
    +id: string
    +fullName: string
    +birthDate: string
    +phone: string
    +lgpdConsentAt: string
    +isAdmin: boolean
  }
  class DashboardData {
    +period
    +kpis: DashboardKpis
    +bySpecialty[]
    +byUnit[]
    +byWeek[]
    +byHour[]
    +byKind[]
    +stockByUnit[]
    +topUnavailable[]
  }
  class StockStatus {
    <<enumeration>>
    disponivel
    atencao
    indisponivel
  }
  class AppointmentKind {
    <<enumeration>>
    consulta
    retorno
    exame
  }
  class AppointmentStatus {
    <<enumeration>>
    agendada
    cancelada
    concluida
  }

  HealthUnit "1" o-- "*" UnitMedication : estoque simulado
  Medication "1" -- "*" UnitMedication
  Specialty "1" -- "*" Doctor
  HealthUnit "1" -- "*" Doctor : atende em
  Doctor "1" -- "*" Appointment
  AuthUser "1" -- "1" UserProfile
  AuthUser "1" -- "*" Appointment
  AuthUser "1" -- "*" Reminder
  AuthUser "1" -- "*" AppNotification
  Reminder "*" --> "0..1" Medication
  AppointmentDraft ..> Appointment : vira, ao salvar
  Appointment --> AppointmentKind
  Appointment --> AppointmentStatus
  Medication --> StockStatus
```

## Repositórios (interfaces)

```mermaid
classDiagram
  direction TB
  class MedicationRepository {
    <<interface>>
    +list(query) Medication[]
    +getById(id) Medication
  }
  class HealthUnitRepository {
    <<interface>>
    +list() HealthUnit[]
    +getById(id) HealthUnit
    +listMedications(unitId) UnitMedication[]
    +unitIdsWithMedication(medicationId) string[]
  }
  class AppointmentRepository {
    <<interface>>
    +listSpecialties() Specialty[]
    +listDoctors(specialtyId) Doctor[]
    +bookedSlots(doctorId, from, to) string[]
    +create(draft) Appointment
    +listMine() Appointment[]
    +cancel(id, reason)
  }
  class ReminderRepository {
    <<interface>>
    +list() Reminder[]
    +create(input) Reminder
    +setActive(id, active)
    +remove(id)
  }
  class NotificationRepository {
    <<interface>>
    +list() AppNotification[]
    +countUnread() number
    +markRead(id)
    +markAllRead()
  }
  class AuthRepository {
    <<interface>>
    +getCurrentUser() AuthUser
    +signUp(input) SignUpResult
    +signIn(email, password) AuthUser
    +signOut()
    +onAuthChange(callback)
  }
  class ProfileRepository {
    <<interface>>
    +getMine() UserProfile
    +updateMine(input) UserProfile
  }
  class AnalyticsRepository {
    <<interface>>
    +getDashboard(days) DashboardData
  }
  class index_ts["repositories/index.ts"] {
    escolhe Mock ou Supabase
  }
  index_ts ..> MedicationRepository
  index_ts ..> HealthUnitRepository
  index_ts ..> AppointmentRepository
  index_ts ..> ReminderRepository
  index_ts ..> NotificationRepository
  index_ts ..> AuthRepository
  index_ts ..> ProfileRepository
  index_ts ..> AnalyticsRepository
```
