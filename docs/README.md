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
| 005 | Leaflet e OpenStreetMap para mapas | Aceita (a implementar) |
| 006 | Integração e entrega contínuas com GitHub Actions | Aceita (a implementar) |
| 007 | Variáveis de ambiente e gestão de chaves | Aceita |
| 008 | Autenticação com Supabase Auth e consentimento LGPD | Aceita |
| 009 | PWA instalável e hospedagem na Vercel | Aceita |

## Índice de features

| Ficha | Feature | Status |
|---|---|---|
| F01 | Lista e busca de medicamentos | Concluída |
| F02 | Banco de dados na nuvem com RLS | Concluída (falta registrar evidências do teste real) |
| F03 | Integração app ↔ Supabase (Repository) | Concluída |
| F04 | Login, cadastro e consentimento LGPD | Concluída (falta registrar evidências) |
| F05 | PWA instalável e publicação na nuvem | Código pronto; falta publicar e registrar evidências |

## Mapa disciplina → onde está documentado

| Disciplina | Onde |
|---|---|
| Modelagem de Padrões de Projetos | ADR-003, F01, F03 |
| Programação Multi Plataforma | ADR-001, ADR-009, F05 |
| Computação em Nuvem | ADR-004, ADR-009, F02, F05 |
| Segurança e Defesa Cibernética | ADR-004, ADR-007, ADR-008, `security/testes-rls.md`, F02, F04 |
| Integração e Entrega Contínua | ADR-006 (a implementar), ADR-009 (deploy automático) |
| Projeto Integrador II | ADR-002 e todo o conjunto |
