# Business Intelligence e segurança

## Fluxo de dados do painel de BI (ADR-015)

```mermaid
flowchart LR
  subgraph Fontes["Fontes - tabelas operacionais"]
    AP[(appointments)]
    PR[(profiles)]
    RM[(reminders)]
    UM[(unit_medications<br/>estoque simulado)]
    CAT[(doctors, specialties,<br/>health_units, medications)]
  end
  subgraph ETL["Agregação no banco - bi_dashboard(p_days)"]
    CK{is_admin?}
    AG[GROUP BY especialidade, unidade,<br/>semana, hora, tipo, status]
    JS[Monta UM JSON<br/>só com contagens]
    CK -- sim --> AG --> JS
    CK -- não --> X[Erro 42501:<br/>Acesso restrito]
  end
  subgraph Vis["Visualização - /painel"]
    K[KPIs]
    G1[Linha: consultas por semana]
    G2[Barras: por especialidade e hora]
    G3[Barras empilhadas: estoque]
    CSV[Exportar CSV]
  end
  DEC([Decisões do gestor:<br/>reforçar horários de pico,<br/>repor remédios em falta])
  Fontes --> CK
  JS --> K & G1 & G2 & G3 & CSV
  K & G1 & G2 & G3 --> DEC
```

## Camadas de segurança (defesa em profundidade)

```mermaid
flowchart TB
  U([Requisição do app]) --> L1
  L1["1. Transporte<br/>HTTPS em tudo"] --> L2
  L2["2. Autenticação<br/>Supabase Auth: JWT da sessão"] --> L3
  L3["3. Permissão por papel - GRANT<br/>anon não lê dados pessoais;<br/>authenticated só altera nome, nascimento e telefone do perfil"] --> L4
  L4["4. Row Level Security<br/>cada linha só para user_id = auth.uid()"] --> L5
  L5["5. Regras no servidor<br/>gatilhos, CHECKs e índices únicos"] --> L6
  L6["6. Funções security definer controladas<br/>booked_slots: só horários; bi_dashboard: só admin e só agregados"] --> DB[(Dados)]
  APP["No app (não é segurança, é usabilidade):<br/>rotas protegidas, validação de formulários,<br/>mensagens claras"] -.-> L1
  PRIV["Privacidade - LGPD:<br/>aceite gravado com data; triagem e assistente no aparelho;<br/>painel sem dados pessoais; .env fora do Git"] -.-> DB
```

## Como o RLS decide (exemplo: listar consultas)

```mermaid
sequenceDiagram
  participant A as App da Maria
  participant API as Supabase API
  participant DB as PostgreSQL
  A->>API: GET appointments (JWT da Maria)
  API->>DB: SET role authenticated, auth.uid() = id da Maria
  DB->>DB: select * from appointments
  DB->>DB: política RLS: where user_id = auth.uid()
  DB-->>A: só as consultas da Maria
  Note over A,DB: Mesmo que o código do app peça "todas",<br/>o banco devolve só as dela. As do João nunca saem do servidor.
```

## Correção de escalada de privilégio (db/08_bi.sql)

```mermaid
flowchart LR
  subgraph Antes["Antes - 01_schema.sql"]
    A1["grant update on profiles"] --> A2["Usuário pode alterar QUALQUER coluna<br/>do próprio perfil"]
    A2 --> A3["update profiles set is_admin = true ❌<br/>update profiles set lgpd_consent_at = null ❌"]
  end
  subgraph Depois["Depois - 08_bi.sql"]
    B1["revoke update on profiles<br/>grant update (full_name, birth_date, phone)"] --> B2["is_admin e lgpd_consent_at<br/>só mudam pelo SQL Editor do dono"]
    B2 --> B3["Teste no CI garante 'permission denied' ✅"]
  end
  Antes --> Depois
```
