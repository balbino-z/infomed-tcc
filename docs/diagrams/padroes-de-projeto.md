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

## Strategy (ADR-013)

```mermaid
classDiagram
  class UnitFilterStrategy {
    <<interface>>
    +matches(unit, ctx) boolean
  }
  class UnitSortStrategy {
    <<interface>>
    +compare(a, b, ctx) number
  }
  class OpenNowFilter
  class ServicesFilter
  class MaxDistanceFilter
  class MedicationAvailableFilter
  class NameSort
  class DistanceSort
  class filterUnits {
    +filterUnits(units, filters, ctx)
  }
  class PostosList
  UnitFilterStrategy <|.. OpenNowFilter
  UnitFilterStrategy <|.. ServicesFilter
  UnitFilterStrategy <|.. MaxDistanceFilter
  UnitFilterStrategy <|.. MedicationAvailableFilter
  UnitSortStrategy <|.. NameSort
  UnitSortStrategy <|.. DistanceSort
  filterUnits ..> UnitFilterStrategy : aplica todas
  filterUnits ..> UnitSortStrategy : ordena
  PostosList --> filterUnits
```

## Chain of Responsibility: assistente (ADR-016)

Cada elo tenta responder; se devolver `null`, a mensagem passa para o próximo. O alerta vem sempre primeiro.

```mermaid
flowchart LR
  M[Mensagem] --> A{Alerta?<br/>emergency.ts}
  A -- sim --> R1[Ligar 192 / 188]
  A -- não --> F1{FAQ quase exata?}
  F1 -- sim --> R2[Resposta da FAQ]
  F1 -- não --> I{Intenção?<br/>remédio, aberto agora,<br/>agendar, cancelar,<br/>lembretes, sintomas}
  I -- sim --> R3[Resposta + botão<br/>para a tela do app]
  I -- não --> F2{FAQ aproximada?}
  F2 -- sim --> R2
  F2 -- não --> R4[Não entendi +<br/>sugestões]
```

```mermaid
classDiagram
  class AssistantHandler {
    <<interface>>
    +name string
    +handle(message, ctx) AssistantReply | null
  }
  class alertHandler
  class strongFaqHandler
  class intentHandler
  class faqHandler
  class fallbackHandler
  class answer {
    +answer(message, ctx, chain)
  }
  AssistantHandler <|.. alertHandler
  AssistantHandler <|.. strongFaqHandler
  AssistantHandler <|.. intentHandler
  AssistantHandler <|.. faqHandler
  AssistantHandler <|.. fallbackHandler
  answer ..> AssistantHandler : percorre em ordem
  intentHandler ..> analyzeSymptoms : triagem (ADR-014)
```
