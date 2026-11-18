# Documentação do projeto InfoMed

Esta pasta reúne o material que alimenta o texto final do TCC. **Comece por [`GUIA-DA-DOCUMENTACAO.md`](GUIA-DA-DOCUMENTACAO.md)**: como rodar, mapa dos arquivos, o que cada disciplina entrega e o roteiro de prints. Regra: **feature sem arquivo em `features/` preenchido não está concluída.**

| Pasta | Conteúdo |
|---|---|
| `decisions/` | ADRs: uma decisão técnica por arquivo (contexto, decisão, alternativas, consequências) |
| `features/` | Uma ficha por funcionalidade concluída (modelo em `features/_modelo.md`) |
| `diagrams/` | 36 diagramas (casos de uso, arquitetura, ER, classes, sequências, estados, padrões, IA, BI, segurança, CI/CD, IoT). **Imagens prontas em `diagrams/imagens/`**; índice em `diagrams/README.md` |
| `data/` | Fontes e decisões sobre os dados reais das unidades de saúde |
| `security/` | Controles de segurança e casos de teste (RLS, LGPD) |
| `evidence/` | Prints de telas, pipeline verde, políticas de RLS, dashboard, pesquisa de usabilidade |
| `ml/` | Avaliação do modelo de IA da triagem (gerada por `scripts/treinar-triagem.mjs`) |

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
| 014 | Triagem por IA no aparelho (Naive Bayes) | Aceita (implementada) |
| 015 | Perfil real e painel de BI com indicadores agregados | Aceita (implementada) |
| 016 | Assistente (chatbot) em camadas, Chain of Responsibility | Aceita (implementada; LLM como trabalho futuro) |

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
| F11 | Integração contínua e testes do banco | Concluída (pipeline verde no run #3) |
| F12 | Triagem por IA (qual especialista) | Concluída (falta registrar evidências) |
| F13 | Perfil real e painel de BI | Concluída (falta rodar 08/09 no Supabase e evidências) |
| F14 | Assistente (chatbot) | Concluída (falta registrar evidências) |

## Mapa disciplina → onde está documentado

| Disciplina | Onde |
|---|---|
| Modelagem de Padrões de Projetos | ADR-003, ADR-011 (Factory), ADR-012 (Observer), ADR-013 (Strategy), ADR-016 (Chain of Responsibility), F01, F03, F06, F08, F09, F10, F14, `diagrams/padroes-de-projeto.md` |
| Programação Multi Plataforma | ADR-001, ADR-005, ADR-009, ADR-010, F05, F06, F07 |
| Computação em Nuvem | ADR-004, ADR-009, F02, F05 |
| Segurança e Defesa Cibernética | ADR-004, ADR-007, ADR-008, ADR-011, ADR-015, `security/testes-rls.md`, F02, F04, F08, F13 |
| Integração e Entrega Contínua | ADR-006, ADR-009 (deploy automático), F11 |
| Inteligência Artificial e Aprendizado de Máquina | ADR-014, ADR-016, F12, F14, `ml/avaliacao-triagem.md` |
| Business Intelligence e Big Data | ADR-015, F13 |
| Estatística Aplicada | `ml/avaliacao-triagem.md` (validação cruzada); pesquisa SUS (T13, a fazer) |
| Sistemas Distribuídos Aplicados a IoT | Sem implementação; ver seção 7.5 do guia |
| Sistemas de Informação e Tecnologias Emergentes | ADR-002, ADR-004, ADR-014, ADR-016, `data/fontes-unidades.md` |
| Língua Inglesa II | `README.md` da raiz (inglês); abstract a fazer |
| Projeto Integrador II | ADR-002 e todo o conjunto |
