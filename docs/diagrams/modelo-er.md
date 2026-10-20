# Modelo de dados (ER)

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "tem"
  AUTH_USERS ||--o{ APPOINTMENTS : "agenda"
  AUTH_USERS ||--o{ REMINDERS : "cria"
  AUTH_USERS ||--o{ NOTIFICATIONS : "recebe"
  SPECIALTIES ||--o{ DOCTORS : "classifica"
  HEALTH_UNITS ||--o{ DOCTORS : "atende em"
  DOCTORS ||--o{ APPOINTMENTS : "realiza"
  MEDICATIONS ||--o{ REMINDERS : "referencia"
  HEALTH_UNITS ||--o{ UNIT_MEDICATIONS : "estoca"
  MEDICATIONS ||--o{ UNIT_MEDICATIONS : "disponivel em"

  AUTH_USERS {
    uuid id PK
  }
  PROFILES {
    uuid id PK
    text full_name
    date birth_date
    text phone
    timestamptz lgpd_consent_at
  }
  MEDICATIONS {
    uuid id PK
    text name
    text dosage
    text form
    text description
    text leaflet_url
  }
  HEALTH_UNITS {
    uuid id PK
    text name
    text address
    float lat
    float lng
    time opens_at
    time closes_at
    text_array services
  }
  UNIT_MEDICATIONS {
    uuid unit_id PK
    uuid medication_id PK
    text status
    timestamptz updated_at
  }
  SPECIALTIES {
    uuid id PK
    text name
    text color
  }
  DOCTORS {
    uuid id PK
    text name
    text crm
    uuid specialty_id FK
    uuid unit_id FK
  }
  APPOINTMENTS {
    uuid id PK
    uuid user_id FK
    uuid doctor_id FK
    timestamptz starts_at
    text status
    text cancel_reason
  }
  REMINDERS {
    uuid id PK
    uuid user_id FK
    uuid medication_id FK
    text_array times
    int_array days_of_week
    boolean active
  }
  NOTIFICATIONS {
    uuid id PK
    uuid user_id FK
    text type
    text title
    text body
    timestamptz read_at
  }
```

## Regras de acesso por tabela

| Tabela | Leitura | Escrita |
|---|---|---|
| medications, health_units, unit_medications, specialties, doctors | Pública | Somente administrador (painel) |
| profiles | Somente o próprio usuário | O próprio usuário (atualização); criação automática por gatilho no cadastro |
| appointments | Somente o próprio usuário | O próprio usuário (inserir e atualizar; sem exclusão) |
| reminders | Somente o próprio usuário | O próprio usuário (inserir, atualizar e excluir) |
| notifications | Somente o próprio usuário | O usuário marca como lida; criação feita pelo servidor |

## Objetos auxiliares

- **View `medications_with_status`**: status agregado do medicamento (disponível, estoque baixo ou indisponível) calculado a partir do estoque por unidade.
- **Função `booked_slots(doctor, de, até)`**: devolve os horários já ocupados de um médico sem expor dados de outros usuários.
- **Gatilho `on_auth_user_created`**: cria o perfil automaticamente quando um usuário se cadastra.
