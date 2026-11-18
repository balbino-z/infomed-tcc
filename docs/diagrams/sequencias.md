# Diagramas de sequência

## 1. Agendar uma consulta (Factory + regras no banco + notificação)

```mermaid
sequenceDiagram
  actor U as Paciente
  participant T as Tela ScheduleDateTime
  participant F as AppointmentFactory
  participant R as AppointmentRepository
  participant API as Supabase API
  participant DB as PostgreSQL
  participant B as EventBus

  U->>T: escolhe dia
  T->>R: bookedSlots(médico, dia)
  R->>API: rpc booked_slots
  API->>DB: função security definer
  DB-->>T: só os horários ocupados (sem dados de outras pessoas)
  T-->>U: horários livres de 30 em 30 min
  U->>T: escolhe horário e confirma
  T->>F: create(tipo, médico, horário, agora)
  alt regra violada no app (antecedência, fim de semana, fora do expediente)
    F-->>T: AppointmentError com mensagem clara
    T-->>U: mostra o erro
  else pedido válido
    F-->>T: AppointmentDraft
    T->>R: create(draft)
    R->>API: insert em appointments (JWT do usuário)
    API->>DB: RLS confere user_id = auth.uid()
    DB->>DB: gatilho appointments_validate revalida as regras
    DB->>DB: índices únicos impedem horário duplicado
    DB->>DB: gatilho appointments_notify cria a notificação
    DB-->>R: consulta criada
    R->>B: emit notifications-changed
    B-->>T: sino e lista de notificações se atualizam
    T-->>U: tela "Consulta confirmada"
  end
```

## 2. Triagem por IA (sintoma para especialidade)

```mermaid
sequenceDiagram
  actor U as Paciente
  participant T as Tela Triage
  participant E as emergency.ts
  participant NB as classifier.mjs Naive Bayes
  participant RU as rules.mjs
  participant R as AppointmentRepository

  U->>T: descreve o que sente e toca em Analisar
  Note over T,NB: tudo roda no aparelho, nada é enviado nem gravado
  T->>E: detectAlert(texto)
  alt sinal de alerta (dor no peito, falta de ar, desmaio...)
    E-->>T: emergência ou risco à vida
    T-->>U: cartão vermelho: ligar 192/193 ou CVV 188, sem agendamento
  else sem alerta
    T->>RU: allowedClasses(texto)
    RU-->>T: sem menção a criança, tira Pediatria
    T->>NB: predict(modelo, texto, classes permitidas)
    NB-->>T: especialidade + probabilidade
    alt probabilidade abaixo de 0,6
      T-->>U: Clínico Geral por precaução, compatibilidade baixa
    else
      T-->>U: especialidade sugerida, compatibilidade alta ou média
    end
    U->>T: Agendar com a especialidade
    T->>R: listSpecialties()
    R-->>T: especialidades com médicos
    T-->>U: abre a escolha do médico daquela especialidade
  end
```

## 3. Assistente: "Onde tem Losartana?"

```mermaid
sequenceDiagram
  actor U as Paciente
  participant A as Tela Assistant
  participant C as answer - corrente
  participant AL as alertHandler
  participant FQ as strongFaqHandler
  participant IN as intentHandler
  participant MR as MedicationRepository
  participant HR as HealthUnitRepository

  U->>A: "Onde tem Losartana?"
  A->>C: answer(mensagem)
  C->>AL: handle
  AL-->>C: null, sem alerta
  C->>FQ: handle
  FQ-->>C: null, nenhuma FAQ parecida
  C->>IN: handle
  IN->>MR: list()
  MR-->>IN: catálogo, acha Losartana
  IN->>HR: unitIdsWithMedication(id)
  HR-->>IN: ids dos postos com estoque
  IN-->>C: resposta + botão "Ver postos com o remédio"
  C-->>A: resposta
  A-->>U: "aparece como disponível em N postos"
  U->>A: toca no botão
  A-->>U: lista de postos já filtrada pelo remédio
```

## 4. Painel de BI (só administrador)

```mermaid
sequenceDiagram
  actor ADM as Administrador
  participant P as Tela Profile
  participant D as Tela Dashboard
  participant AR as AnalyticsRepository
  participant API as Supabase API
  participant DB as PostgreSQL

  ADM->>P: abre o Perfil
  P->>API: select profiles do próprio usuário
  API-->>P: is_admin = true
  P-->>ADM: mostra o item "Painel de BI"
  ADM->>D: abre /painel e escolhe 90 dias
  D->>AR: getDashboard(90)
  AR->>API: rpc bi_dashboard(p_days = 90)
  API->>DB: função security definer
  DB->>DB: is_admin()? senão erro 42501 "Acesso restrito"
  DB->>DB: agrega consultas, usuários, lembretes, estoque
  DB-->>AR: um JSON só com números, sem ids, nomes ou e-mails
  AR-->>D: DashboardData
  D-->>ADM: KPIs e gráficos
  ADM->>D: Exportar CSV
  D-->>ADM: arquivo .csv com separador ponto e vírgula, para o Excel
```

## 5. Aviso "Hora do remédio" (Observer)

```mermaid
sequenceDiagram
  participant S as ReminderScheduler
  participant R as ReminderRepository
  participant B as EventBus
  participant A as ReminderAlerts
  actor U as Paciente

  loop a cada 20 segundos, com o app aberto
    S->>R: list()
    R-->>S: lembretes ativos
    S->>S: algum horário de hoje chegou? (fuso de São Paulo)
  end
  S->>B: emit reminder-due
  B-->>A: aviso
  A-->>U: "Hora do remédio" na tela, e notificação do sistema se permitida
  U->>A: "Adiar 10 min"
  A->>B: emit reminder-due depois de 10 minutos
```

## 6. Cadastro com consentimento LGPD

Ver `fluxo-autenticacao.md`.
