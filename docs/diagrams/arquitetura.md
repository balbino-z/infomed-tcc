# Arquitetura (visão geral)

```mermaid
flowchart TB
  U[Usuário] --> PWA[PWA React + Vite + TypeScript]
  subgraph Front-end
    PWA --> T[Telas / features]
    T --> R[Repository - interface]
    R --> M[Mock - sem .env]
    R --> S[Supabase - com .env]
  end
  S --> DB[(PostgreSQL + RLS)]
  S --> AU[Auth]
  S --> EF[Edge Functions - IA]
  DB --> V[Views SQL]
  V --> BI[Dashboard BI]
  GH[GitHub Actions] --> PWA
```

## Camadas do front-end

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Interface | `src/app/components` | Telas e componentes visuais |
| Domínio | `src/app/domain` | Entidades e tipos (ex.: `Medication`) |
| Repositórios | `src/app/repositories` | Contratos e implementações de acesso a dados |
| Infraestrutura | `src/app/lib` | Conexão com serviços externos (Supabase) |
| Estado/Features | `src/app/features` | Estado compartilhado e lógica de cada funcionalidade (ex.: autenticação) |
