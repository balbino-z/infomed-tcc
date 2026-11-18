# Arquitetura

## Visão geral

```mermaid
flowchart TB
  U([Usuário no celular ou PC])
  ADM([Administrador])

  subgraph Aparelho["Aparelho do usuário (PWA no navegador)"]
    direction TB
    T[Telas React]
    F[Features: agendamento, lembretes, filtros, triagem IA, assistente]
    R[Repositórios - interfaces]
    MK[Implementações Mock<br/>sem .env: testes e demonstração]
    SB[Implementações Supabase<br/>com .env]
    IA[Modelo de IA local<br/>model.json]
    SW[Service Worker<br/>cache da interface]
    T --> F --> R
    R --> MK
    R --> SB
    F --> IA
  end

  subgraph Nuvem["Nuvem"]
    direction TB
    VC[Vercel<br/>hospeda o site - CDN]
    subgraph Supa["Supabase - região São Paulo"]
      AU[Auth<br/>login e sessão]
      API[API REST automática]
      DB[(PostgreSQL<br/>RLS, gatilhos, funções)]
      API --> DB
      AU --> DB
    end
    OSM[OpenStreetMap<br/>mapas]
  end

  subgraph Dev["Desenvolvimento"]
    direction TB
    GH[GitHub<br/>código]
    CI[GitHub Actions<br/>CI: testes app e banco]
  end

  U --> T
  ADM --> T
  VC -- entrega o app --> SW
  SB -- HTTPS --> API
  SB -- HTTPS --> AU
  F -- mapa --> OSM
  GH --> CI
  GH -- deploy a cada push --> VC
```

## Camadas do front-end

```mermaid
flowchart LR
  subgraph UI["Interface - components/"]
    S[screens/: 25 telas]
    SH[shared/: Header, BottomNav, AssistantFab]
  end
  subgraph FE["Lógica - features/"]
    NAV[navigation]
    AUTH[auth]
    SCH[scheduling - Factory]
    NOT[notifications - Observer]
    FIL[units/filters - Strategy]
    TRI[triage - IA]
    AST[assistant - Chain of Responsibility]
  end
  subgraph DOM["Domínio - domain/"]
    E[Entidades: Medication, HealthUnit,<br/>Appointment, Reminder, Notification,<br/>Profile, Dashboard]
  end
  subgraph REP["Dados - repositories/"]
    I[Interfaces]
    M[mock/]
    SUP[supabase/]
    IDX[index.ts escolhe Mock ou Supabase]
  end
  LIB[lib/supabase.ts]
  UI --> FE --> REP
  UI --> DOM
  FE --> DOM
  REP --> DOM
  I --> M
  I --> SUP --> LIB
  IDX --> I
```

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Interface | `src/app/components` | Telas e componentes visuais |
| Lógica/Features | `src/app/features` | Regras de cada funcionalidade e os padrões de projeto |
| Domínio | `src/app/domain` | Entidades e tipos do negócio |
| Repositórios | `src/app/repositories` | Contratos e implementações de acesso a dados (Mock e Supabase) |
| Infraestrutura | `src/app/lib` | Conexão com o Supabase |

## Implantação (onde cada parte roda)

```mermaid
flowchart LR
  subgraph Cel["Celular Android / PC"]
    BR[Navegador Chrome ou Edge]
    APP[InfoMed PWA<br/>HTML, JS, CSS em cache]
    BR --- APP
  end
  subgraph Vercel["Vercel"]
    CDN[CDN global<br/>arquivos estáticos do build]
  end
  subgraph Supabase["Supabase - sa-east-1"]
    GW[API Gateway<br/>REST e Auth]
    PG[(PostgreSQL 15+)]
    GW --> PG
  end
  subgraph OSM["OpenStreetMap"]
    TILES[Servidores de mapa]
  end
  subgraph GitHub["GitHub"]
    REPO[Repositório]
    ACT[Actions<br/>Ubuntu + Node 22 + PostgreSQL 16]
  end
  APP -- HTTPS --> CDN
  APP -- HTTPS + chave publishable + JWT --> GW
  APP -- HTTPS --> TILES
  REPO --> ACT
  REPO -- push na main --> CDN
```
