# Documentação do projeto InfoMed

Esta pasta reúne o material que alimenta o texto final do TCC. Regra: **feature sem arquivo em `features/` preenchido não está concluída.**

| Pasta | Conteúdo |
|---|---|
| `decisions/` | ADRs: uma decisão técnica por arquivo (contexto, decisão, alternativas, consequências) |
| `features/` | Uma ficha por funcionalidade concluída (modelo em `features/_modelo.md`) |
| `diagrams/` | Diagramas em Mermaid (arquitetura, modelo ER, classes, fluxos) |
| `data/` | Fontes e decisões sobre os dados reais das unidades de saúde |
| `security/` | Controles de segurança e casos de teste (RLS, LGPD) |
| `evidence/` | Prints de telas, pipeline verde, políticas de RLS, dashboard, pesquisa de usabilidade |

## Índice de decisões

| ADR | Título | Status |
|---|---|---|
| 001 | Stack tecnológica do front-end | Aceita |
| 002 | Do protótipo do Figma Make para código de produção | Aceita |
| 003 | Padrão Repository para acesso a dados | Aceita |
| 004 | Supabase como backend e banco de dados na nuvem | Aceita (implementada) |
| 005 | Leaflet e OpenStreetMap para mapas | Aceita (implementada) |
| 006 | Integração e entrega contínuas com GitHub Actions e Vercel | Aceita (implementada) |
| 007 | Variáveis de ambiente e gestão de chaves | Aceita |
| 008 | Autenticação com Supabase Auth e consentimento LGPD | Aceita |
| 009 | PWA instalável e hospedagem na Vercel | Aceita |
| 010 | Navegação por rotas com react-router | Aceita (implementada) |
| 011 | Agendamento: regras no banco e padrão Factory | Aceita (implementada) |
| 012 | Padrão Observer para notificações e lembretes | Aceita (implementada) |
| 013 | Padrão Strategy para filtros e ordenação dos postos | Aceita (implementada) |

## Índice de features

| Ficha | Feature | Status |
|---|---|---|
| F01 | Lista e busca de medicamentos | Concluída |
| F02 | Banco de dados na nuvem com RLS | Concluída (falta registrar evidências do teste real) |
| F03 | Integração app ↔ Supabase (Repository) | Concluída |
| F04 | Login, cadastro e consentimento LGPD | Concluída (falta registrar evidências) |
| F05 | PWA instalável e publicação na nuvem | Concluída (falta registrar evidências) |
| F06 | Postos reais com lista, detalhe e mapa | Concluída (falta registrar evidências) |
| F07 | Navegação por rotas (voltar e links diretos) | Concluída (falta registrar evidências) |
| F08 | Agendamento, histórico e cancelamento | Concluída (falta registrar evidências) |
| F09 | Lembretes de medicação e notificações | Concluída (falta registrar evidências) |
| F10 | Filtros e ordenação dos postos | Concluída (falta registrar evidências) |
| F11 | Integração contínua e testes do banco | Concluída (falta o print do pipeline) |

## Mapa disciplina → onde está documentado

| Disciplina | Onde |
|---|---|
| Modelagem de Padrões de Projetos | ADR-003, ADR-011 (Factory), ADR-012 (Observer), ADR-013 (Strategy), F01, F03, F06, F08, F09, F10, `diagrams/padroes-de-projeto.md` |
| Programação Multi Plataforma | ADR-001, ADR-005, ADR-009, ADR-010, F05, F06, F07 |
| Computação em Nuvem | ADR-004, ADR-009, F02, F05 |
| Segurança e Defesa Cibernética | ADR-004, ADR-007, ADR-008, ADR-011, `security/testes-rls.md`, F02, F04, F08 |
| Integração e Entrega Contínua | ADR-006, ADR-009 (deploy automático), F11 |
| Projeto Integrador II | ADR-002 e todo o conjunto |
