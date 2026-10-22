# Padrões de projeto aplicados

## Repository (ADR-003)

```mermaid
classDiagram
  class Tela
  class AppointmentRepository {
    <<interface>>
    +listSpecialties()
    +listDoctors(specialtyId)
    +bookedSlots(doctorId, from, to)
    +create(draft)
    +listMine()
    +cancel(id, reason)
  }
  class MockAppointmentRepository
  class SupabaseAppointmentRepository
  Tela --> AppointmentRepository
  AppointmentRepository <|.. MockAppointmentRepository
  AppointmentRepository <|.. SupabaseAppointmentRepository
```

O mesmo desenho vale para `MedicationRepository`, `HealthUnitRepository`, `AuthRepository`, `NotificationRepository` e `ReminderRepository`.

## Factory (ADR-011)

```mermaid
classDiagram
  class AppointmentFactory {
    +kinds() KindRules[]
    +rulesFor(kind) KindRules
    +earliestStart(kind, now) Date
    +create(kind, doctor, startsAt, now) AppointmentDraft
  }
  class KindRules {
    kind
    label
    minLeadMinutes
    maxDaysAhead
  }
  class AppointmentDraft {
    kind
    doctorId
    startsAt
  }
  class ScheduleDateTime
  AppointmentFactory ..> KindRules : usa
  AppointmentFactory ..> AppointmentDraft : cria
  ScheduleDateTime --> AppointmentFactory
```

## Observer (ADR-012)

```mermaid
sequenceDiagram
  participant Tela as ScheduleDateTime
  participant Repo as AppointmentRepository
  participant Bus as EventBus
  participant Sino as Header (sino)
  participant Lista as Notificações
  Sino->>Bus: on("notifications-changed")
  Lista->>Bus: on("notifications-changed")
  Tela->>Repo: create(draft)
  Repo->>Bus: emit("notifications-changed")
  Bus-->>Sino: atualiza o contador
  Bus-->>Lista: recarrega a lista
```

```mermaid
flowchart LR
  A[ReminderScheduler: a cada 20 s] --> B{dueReminders: chegou a hora?}
  B -- sim --> C[bus.emit reminder-due]
  C --> D[ReminderAlerts: aviso na tela]
  C --> E[Notification do sistema, se permitido]
  B -- não --> A
```

## Strategy (planejado, T9)

Filtros dos postos (por distância, serviço, aberto agora e estoque) como estratégias intercambiáveis.
