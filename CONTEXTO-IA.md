# CONTEXTO-IA.md — InfoMed (leia antes de ajudar)

> Arquivo para qualquer assistente de IA (Claude etc.) que for ajudar no projeto.
> Fonte da verdade sobre o estado do código: o próprio repositório (`git log`) e `docs/PROGRESSO.md`.
> Se este arquivo contradizer o código, pergunte ao usuário e proponha corrigir este arquivo.

## 1. O projeto

- **InfoMed**: app de saúde pública digital. Funções: consultar medicamentos e disponibilidade nos postos, localizar unidades de saúde (mapa), agendar consultas, criar lembretes de medicação, receber notificações.
- **TCC em dupla**, curso de Sistemas, prazo ~1 mês a partir de 20/10/2026. Um integrante programa, outro escreve o texto; os dois alternam sessões de código, cada um com seu próprio chat de IA.
- **Cidade-alvo:** Santa Bárbara d'Oeste (SP). As unidades de saúde hoje no banco são **fictícias** (coordenadas de exemplo em São Paulo capital) e serão substituídas por dados reais (tarefa T3).
- **Princípio:** entregar menos, porém bem estruturado e bem documentado. Nada de aparência de trabalho desorganizado.
- O estoque de medicamentos por unidade é **simulado** (não há fonte pública confiável). Isso deve constar no TCC.

## 2. Disciplinas que o projeto precisa demonstrar

Projeto Integrador II; Modelagem de Padrões de Projetos (Repository feito; Observer, Strategy, Factory a fazer); Programação Multi Plataforma (PWA); Computação em Nuvem (Supabase); Integração e Entrega Contínua (GitHub Actions); Segurança e Defesa Cibernética (Auth, RLS, LGPD); IA e Aprendizado de Máquina (1 funcionalidade simples); Business Intelligence e Big Data (dashboard); IoT (opcional); Estatística Aplicada (pesquisa SUS); Sistemas de Informação e Tecnologias Emergentes (fundamentação); Língua Inglesa II (abstract e README em inglês).

## 3. Stack (decidida, não trocar sem ADR)

React 18 · Vite · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL, Auth, RLS, Edge Functions) · Leaflet 1.9 + react-leaflet 4.2 (React 18) + OpenStreetMap (feito) · Vitest + Testing Library · GitHub / GitHub Actions (a fazer) · PWA com `vite-plugin-pwa` (feito) · Vercel para hospedagem (ADR-009) · Capacitor/APK só como bônus; iOS fora do escopo.

Origem do front: protótipo gerado no Figma Make e refatorado (ver `docs/decisions/ADR-002`). As telas em `components/screens` vieram de lá; componentes em `components/ui` são do Figma Make (muitos sem uso).

## 4. Estrutura

```
src/app/
  App.tsx                 só monta BrowserRouter, providers e o layout (moldura de iPhone só em telas md+)
  components/screens/     20 telas (Welcome, Onboarding1-3, Login, Signup, Home, MedicationList,
                          MedicationDetail, PostosList, PostoDetail, Schedule*, AppointmentConfirmed,
                          CancelAppointment, Notifications, History, Reminders, CreateReminder,
                          MapFilters, Profile)
  components/shared/      BottomNav, Header, SearchBar...
  domain/                 entidades: medication.ts, user.ts
  repositories/           interfaces (Medication, Auth, HealthUnit, Appointment, Notification, Reminder)
    mock/                 implementações em memória
    supabase/             implementações reais
    index.ts              ÚNICO lugar que escolhe Mock ou Supabase (pela existência do .env)
  features/auth/          AuthContext (estado de login) + auth.test.tsx
  features/navigation/    routes.ts (URL de cada tela), AppRoutes (rotas + proteção), useAppNavigate (adaptador navigate('tela', dados)), AppData (dados entre telas, em memória)
  features/scheduling/    AppointmentFactory (padrão Factory), slots, dateUtils (fuso de São Paulo)
  features/notifications/ EventBus (padrão Observer), useUnreadCount
  features/reminders/     ReminderScheduler (hora do remédio, só com o app aberto), ReminderAlerts
  features/units/filters/ estratégias de filtro e ordenação (padrão Strategy) + filterUnits
  features/units/         unitUtils (aberto/fechado, distância), UnitsMap (Leaflet), useUserLocation, testes
  lib/supabase.ts         cliente Supabase (null sem .env)
db/                       01_schema, 02_seed, 03_teste_rls, 04_auth, (05_postos_reais gerado por script), 06_agendamento, 07_lembretes — numerados
data/ e scripts/          dados das UBS reais e scripts que geram o SQL (T3)
docs/                     decisions (ADR-001..008), features (F01..F04), diagrams, security, evidence, PROGRESSO.md
```

## 5. Banco de dados (Supabase, região São Paulo)

Catálogo (leitura pública): `medications`, `health_units`, `unit_medications` (status por unidade: disponivel/atencao/indisponivel), `specialties`, `doctors`.
Dados pessoais (RLS por `user_id = auth.uid()`): `profiles` (inclui `lgpd_consent_at`), `appointments`, `reminders`, `notifications`.
Objetos: view `medications_with_status` (security_invoker); função `booked_slots(doctor, from, to)` (security definer, só devolve horários ocupados); gatilho `on_auth_user_created` cria o perfil e grava o aceite da LGPD; índice único impede dois agendamentos ativos no mesmo médico e horário.
**RLS filtra linhas e GRANT libera a tabela: toda tabela nova precisa dos dois.**

## 6. Regras (obrigatórias)

1. Telas **nunca** acessam o Supabase direto; usam interfaces de `repositories/`. Para um recurso novo: entidade em `domain/`, interface, implementação Mock, implementação Supabase, registro em `repositories/index.ts`.
2. Sem `any` novo; manter `npx tsc --noEmit` limpo.
3. Regras de negócio críticas ficam **também no banco** (gatilhos, índices únicos, RLS); o app só as espelha para dar mensagem clara. Mudança no banco = **novo arquivo** em `db/` com número seguinte (05, 06...). Nunca editar `01_schema.sql`. Incluir `grant` e `policy`. Avisar o parceiro: o Supabase é único e só um roda o script.
4. Nunca usar, pedir ou versionar a chave `service_role`/secret. Só `VITE_SUPABASE_URL` e a chave `publishable` no front. O `.env` nunca vai para o Git (`.env.example` é o modelo).
5. Interface em português, mantendo o visual do Figma (cores: azul `#0A73FF`, fundo `#F7FAFF`, texto `#1A2B48`, alerta `#FF4D5E`, sucesso `#27C183`).
6. Não adicionar bibliotecas sem justificar; não reintroduzir MUI, emotion, react-slick, react-dnd, motion, date-fns.
7. Navegação: telas continuam usando `navigate('tela', dados)`; **tela nova = nova entrada em `routes.ts` (SCREEN_PATH) + `<Route>` em `AppRoutes.tsx`**. Itens com detalhe usam `/:id` e carregam pelo repositório. `react-router` fica na série 7 (a 8 exige React 19).
7b. Antes de declarar pronto: `npx tsc --noEmit`, `npm test`, `npm run build`.
8. Toda decisão técnica nova → ADR em `docs/decisions`; toda funcionalidade concluída → ficha em `docs/features`; evidências em `docs/evidence`.
9. Ao final de cada sessão, gerar um resumo para colar em `docs/PROGRESSO.md`.
10. Não inventar arquivos nem afirmar que algo existe sem verificar. Em dúvida, peça ao usuário para mostrar o arquivo ou rodar `git log --oneline`.

## 7. Comandos

**CI:** `.github/workflows/ci.yml` roda 2 jobs a cada push/PR na `main`: App (npm ci, typecheck, test, build) e Database (PostgreSQL + `db/ci/00_supabase_stub.sql` + scripts 01-07 + `db/ci/tests.sql`). **Mudou regra do banco = atualizar `db/ci/tests.sql`** e rodar local com psql. Antes de dar push, rodar `npm run typecheck && npm test && npm run build`.

Os testes (`vitest.config.ts`) forçam os repositórios Mock, mesmo com `.env`. Telas que usam `Header` precisam ser renderizadas dentro de `<MemoryRouter>` nos testes.

```
npm install          # instalar dependências
npm run dev          # rodar (http://localhost:5173)
npm test             # testes (Vitest: auth, postos, navegação)
npm run typecheck    # checar tipos (tsc --noEmit)
npm run build        # build de produção
```
Vitest está fixado na versão 3 (a 4+/5 exige Vite mais novo que o do projeto).

## 8. Estado atual (conferir em docs/PROGRESSO.md)

Feito: limpeza do export do Figma Make; git/GitHub; tsconfig; padrão Repository (Medication e Auth); banco com RLS e seed; tela de Medicamentos lendo do banco; login/cadastro com aceite LGPD; 4 testes automatizados; PWA configurado e publicado na Vercel; unidades reais de Santa Bárbara d'Oeste no banco (estoque e médicos SIMULADOS); telas de Postos com mapa Leaflet e "Perto de mim"; navegação por rotas; agendamento completo (regras também no banco), histórico e cancelamento; lembretes e notificações; filtros dos postos (Strategy); CI com 2 jobs (app e banco); 50 testes; README em inglês; ADRs 001-013; fichas F01-F11.
Pendente de confirmação no ambiente real: login/cadastro no navegador, `db/04_auth.sql` no Supabase, teste de RLS com 2 contas (prints em `docs/evidence`).
Pendente de construção: T11 (IA), T12 (BI), T13 (SUS) (ver seção 9). Pendente de confirmação no ambiente real: rodar `db/06` e `db/07` no Supabase. 

## 9. Fila de tarefas

T1, T2, T3 (unidades reais, ver `docs/data/fontes-unidades.md`), T4 (`HealthUnitRepository` e telas de Postos) e T5 (mapa Leaflet) **feitas** · T6 (react-router) **feita** · T7 agendamento (Factory) e T8 lembretes e notificações (Observer) **feitas** · T9 filtros dos postos (Strategy) e T10 CI (GitHub Actions) **feitas** · T11 IA (sintoma → especialidade, Edge Function, aviso de que não substitui consulta) · T12 dashboard de BI · T13 pesquisa SUS.

## 10. Armadilhas já encontradas

- Código do Figma Make usava `pacote@versão` em dependências e imports; já corrigido. Se aparecer de novo, rodar `node fix-imports.mjs`.
- Projeto deve ficar fora do OneDrive (`C:\projetos\InfoMed`).
- O Vite só lê o `.env` ao iniciar; reiniciar `npm run dev` após mudar.
- `package.json`, `AppRoutes.tsx`, `routes.ts` e `repositories/index.ts` são os arquivos que mais geram conflito entre os dois devs.
- Dados fixos que ainda existem nas telas (a migrar para repositórios): postos, médicos, especialidades, notificações, histórico, lembretes, textos como "Dezembro 2024".

## 11. Perfil do usuário e estilo de resposta

Usuário em Windows com VS Code e terminal do VS Code; nível iniciante em terminal/Git. Responder em português, passo a passo, um passo de cada vez, dizendo qual arquivo abrir/criar e o que colar, como conferir se deu certo e o que fazer se falhar. Código completo e testado quando possível. Nunca pedir para colar chaves ou o conteúdo do `.env` no chat.
