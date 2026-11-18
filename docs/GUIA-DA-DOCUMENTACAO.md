# InfoMed: guia completo para quem vai escrever o TCC

> Documento de entrega da equipe de código para a equipe de documentação.
> Última atualização: 18/11/2026. Fonte da verdade: este repositório (`git log`) e `docs/PROGRESSO.md`.
> Se algo aqui não bater com o que vocês virem no app, avisem quem programa antes de escrever.

## Sumário

1. [Situação do projeto (está pronto?)](#1-situação-do-projeto-está-pronto)
2. [O que é o InfoMed, em uma página](#2-o-que-é-o-infomed-em-uma-página)
3. [Como acessar](#3-como-acessar)
4. [Como rodar na sua máquina (Windows)](#4-como-rodar-na-sua-máquina-windows)
5. [Mapa do repositório: cada pasta e arquivo, para que serve](#5-mapa-do-repositório-cada-pasta-e-arquivo-para-que-serve)
6. [Telas e funcionalidades](#6-telas-e-funcionalidades)
7. [O que o TCC entrega em cada disciplina do 2º ano](#7-o-que-o-tcc-entrega-em-cada-disciplina-do-2º-ano)
8. [Roteiro de evidências (prints)](#8-roteiro-de-evidências-prints)
9. [Números prontos para citar no texto](#9-números-prontos-para-citar-no-texto)
10. [Limitações (precisam aparecer no TCC)](#10-limitações-precisam-aparecer-no-tcc)
11. [O que ainda falta e de quem é](#11-o-que-ainda-falta-e-de-quem-é)
12. [Sugestão de estrutura do texto do TCC](#12-sugestão-de-estrutura-do-texto-do-tcc)
13. [Glossário](#13-glossário)

---

## 1. Situação do projeto (está pronto?)

**O código está pronto** para o escopo combinado. Todas as funcionalidades planejadas foram implementadas, testadas automaticamente e conferidas no navegador:

| Situação | Itens |
|---|---|
| ✅ Pronto e testado | Medicamentos, postos com mapa, filtros, agendamento, histórico, cancelamento, lembretes, notificações, login/cadastro com LGPD, PWA, rotas, triagem por IA, perfil, painel de BI, assistente (chatbot), CI |
| ✅ Pipeline | GitHub Actions verde (run #3, commit `8787ad8`): 104 testes de app + testes de banco |
| ⏳ Falta (não é código) | Pesquisa de usabilidade SUS (Estatística), prints de evidência, abstract em inglês, conferir 4 endereços de UBS, rodar os SQL 06 a 09 no Supabase e anotar os testes de RLS |
| ⚠️ Lacuna conhecida | **Sistemas Distribuídos Aplicados a IoT**: não há parte de IoT no código. Ver a seção 7.5 para as opções |

Detalhes do que falta: seção 11.

---

## 2. O que é o InfoMed, em uma página

**Problema.** Em Santa Bárbara d'Oeste (SP), quem usa o SUS não tem um lugar único para saber se o remédio está disponível no posto, qual UBS está aberta, como marcar consulta ou lembrar de tomar o remédio.

**Solução.** Um aplicativo web instalável no celular (PWA) que reúne:

- **Medicamentos**: busca e disponibilidade por unidade (estoque **simulado**).
- **Postos de saúde**: 15 UBS reais da cidade em lista e mapa, aberto/fechado agora, "perto de mim", filtros.
- **Agendamento**: especialidade → médico → data e hora, com regras de negócio também no banco; histórico e cancelamento.
- **Lembretes de remédio** e **notificações** automáticas.
- **Triagem por IA**: a pessoa descreve o que sente e o app sugere a especialidade (não é diagnóstico); sinais de emergência mandam ligar 192.
- **Assistente (chatbot)**: tira dúvidas e leva à tela certa, sem custo de API.
- **Perfil** com dados editáveis e registro do aceite da LGPD.
- **Painel de BI** para o administrador, só com números agregados.

**Tecnologias.** React 18 + TypeScript + Vite + Tailwind (front), Supabase (PostgreSQL na nuvem, autenticação e segurança por linha), Leaflet + OpenStreetMap (mapa), Recharts (gráficos), Vitest (testes), GitHub Actions (CI) e Vercel (hospedagem).

**Arquitetura em uma frase.** As telas nunca falam com o banco direto: falam com "repositórios" (interfaces), que têm duas implementações, uma de mentira (Mock, para testes e demonstração sem internet) e uma real (Supabase). A segurança dos dados está no próprio banco (RLS), não só no app.

Diagrama: `docs/diagrams/arquitetura.md`.

---

## 3. Como acessar

| O quê | Como |
|---|---|
| Código | GitHub, repositório `balbino-z/infomed-tcc`. É **privado**: peça ao dono para te adicionar em *Settings → Collaborators* |
| App publicado | Link da Vercel: peça ao dono (é o link que vai para a banca e para a pesquisa SUS) |
| Banco (Supabase) | **Só o dono acessa.** Prints do painel do Supabase (tabelas, políticas RLS) devem ser pedidos a ele |
| Pipeline (CI) | Aba **Actions** do repositório no GitHub |
| Diagramas | **Prontos como imagem** em `docs/diagrams/imagens/` (36 diagramas, cada um em SVG e PNG). Índice com todos visíveis: `docs/diagrams/README.md`. Para alterar um diagrama: edite o `.md` de `docs/diagrams/` e rode `node scripts/gerar-diagramas.mjs` |

> **Regra de segurança:** nunca colem senhas, chaves ou o conteúdo do arquivo `.env` em documentos, prints ou chats. A chave "publishable" do Supabase é pública por natureza (vai junto com o site), mas a senha do banco e a chave `service_role` nunca.

---

## 4. Como rodar na sua máquina (Windows)

### 4.1 Instalar (uma vez)

1. **Node.js 22 LTS** ou mais novo: https://nodejs.org (aceite as opções padrão).
2. **Git**: https://git-scm.com.
3. **VS Code**: https://code.visualstudio.com. Extensão recomendada: *Markdown Preview Mermaid Support* (para ver os diagramas).

Confira no terminal: `node -v` deve mostrar v22 ou maior.

### 4.2 Baixar o projeto

Crie a pasta **fora do OneDrive** (o OneDrive trava a pasta `node_modules`):

```bash
mkdir C:\projetos
```
```bash
cd C:\projetos
```
```bash
git clone https://github.com/balbino-z/infomed-tcc.git InfoMed
```
```bash
cd InfoMed
```
```bash
npm install
```

### 4.3 Escolher o modo

| Modo | Quando usar | Como |
|---|---|---|
| **Mock** (padrão) | Escrever, entender o app, prints das telas sem depender de internet | Não crie o arquivo `.env`. O app usa dados de exemplo ("UBS Exemplo Centro" etc.) |
| **Supabase** (real) | Prints com as UBS reais e dados da nuvem | Peça ao dono o conteúdo do `.env` (por mensagem privada, nunca em grupo) e salve como `.env` na raiz. **Mais simples: use o link da Vercel**, que já é o modo real |

No **modo Mock**:
- O login aceita qualquer e-mail e senha (não é seguro, é só demonstração).
- Para ver o **Painel de BI**, entre com um e-mail que **comece com `admin`** (ex.: `admin@teste.com`).
- Os números do painel são fictícios e fixos.

### 4.4 Rodar

```bash
npm run dev
```

Abra http://localhost:5173. Para parar: `Ctrl + C` no terminal.

**Ver como celular:** no Chrome, `F12` → ícone de celular (Toggle device toolbar) → escolha um modelo (ex.: iPhone 12 Pro). Em tela larga o app aparece dentro de uma moldura de iPhone; ambos servem para print.

### 4.5 Rodar os testes (para print de evidência)

```bash
npm run typecheck
```
```bash
npm test
```
```bash
npm run build
```

Resultado esperado: sem erros de tipo, **104 testes passando** em 9 arquivos, build concluído.

### 4.6 Retreinar o modelo de IA (opcional, para print)

```bash
node scripts/treinar-triagem.mjs
```

Imprime o alfa escolhido, a acurácia da validação cruzada e a do teste, e regrava `docs/ml/avaliacao-triagem.md`.

### 4.7 Problemas comuns

| Sintoma | Solução |
|---|---|
| `npm` não é reconhecido | Feche e abra o VS Code depois de instalar o Node |
| Erro de permissão em `node_modules` | A pasta está no OneDrive; mova para `C:\projetos` |
| Mudou o `.env` e nada mudou | Pare (`Ctrl + C`) e rode `npm run dev` de novo |
| Painel de BI demora na primeira vez | Normal no modo de desenvolvimento (o Vite prepara a biblioteca de gráficos); recarregue |

---

## 5. Mapa do repositório: cada pasta e arquivo, para que serve

### 5.1 Raiz

| Arquivo/pasta | Para que serve | Disciplina |
|---|---|---|
| `README.md` | Apresentação do projeto **em inglês** | Língua Inglesa II |
| `CONTEXTO-IA.md` | Regras e contexto para assistentes de IA que ajudaram no código | Projeto Integrador II |
| `RELATORIO-FINAL-INFOMED.md` | Relatório de passagem entre sessões de desenvolvimento | Projeto Integrador II |
| `package.json` | Dependências e comandos (`dev`, `test`, `build`, `typecheck`) | Programação Multi Plataforma |
| `vite.config.ts` | Configuração do build e do **PWA** (manifesto, service worker) | Programação Multi Plataforma |
| `vitest.config.ts` | Configuração dos testes (sempre em modo Mock) | Integração e Entrega Contínua |
| `vercel.json` | Hospedagem: faz os links diretos funcionarem (SPA) | Computação em Nuvem |
| `.env.example` | Modelo das variáveis de ambiente (o `.env` real nunca vai para o Git) | Segurança |
| `.github/workflows/ci.yml` | **Pipeline de CI**: 2 jobs (App e Database) a cada push | Integração e Entrega Contínua |
| `public/` | Ícones do app instalável | Programação Multi Plataforma |
| `infomed-*.zip`, `*.pdf` | Pacotes e relatórios antigos de passagem; não fazem parte do código | — |

### 5.2 `src/app/` (o aplicativo)

| Pasta | Conteúdo | Destaque para o texto |
|---|---|---|
| `components/screens/` | As 25 telas (uma por arquivo) | Ver seção 6 |
| `components/shared/` | Peças reaproveitadas: `Header`, `BottomNav`, `SearchBar`, `AssistantFab` (botão do chatbot) | — |
| `components/ui/`, `figma/`, `imports/` | Componentes que vieram do protótipo do Figma Make | ADR-002 |
| `domain/` | Entidades do negócio: `medication`, `health-unit`, `appointment`, `reminder`, `notification`, `user`, `profile`, `analytics` | Modelagem |
| `repositories/` | **Padrão Repository**: interfaces + `mock/` + `supabase/`; `index.ts` é o único lugar que escolhe qual usar | Padrões de Projeto, Nuvem |
| `features/auth/` | Login, sessão e proteção das telas | Segurança |
| `features/navigation/` | Rotas (URLs em português), voltar, links diretos | Multi Plataforma |
| `features/scheduling/` | **Padrão Factory** (`AppointmentFactory.ts`), horários, fuso de São Paulo | Padrões de Projeto |
| `features/notifications/` | **Padrão Observer** (`NotificationBus.ts`) | Padrões de Projeto |
| `features/reminders/` | Agendador do aviso "Hora do remédio" | Multi Plataforma |
| `features/units/` | Mapa Leaflet, distância, aberto/fechado | Multi Plataforma |
| `features/units/filters/` | **Padrão Strategy** (filtros e ordenação dos postos) | Padrões de Projeto |
| `features/triage/` | **IA**: classificador Naive Bayes (`classifier.mjs`), regras de emergência (`emergency.ts`), regra da Pediatria (`rules.mjs`), modelo treinado (`model.json`) | IA e Aprendizado de Máquina |
| `features/assistant/` | **Chatbot** com **Chain of Responsibility** (`handlers.ts`, `assistant.ts`), perguntas frequentes (`faq.json`) | Padrões de Projeto, IA |
| `features/profile/` | Formatação e validação de telefone, data, nome | Segurança |
| `features/analytics/` | Exportação do painel em CSV | BI |
| `lib/supabase.ts` | Conexão com o Supabase (desligada se não houver `.env`) | Nuvem |
| `**/*.test.tsx` | Testes automatizados (9 arquivos, 104 testes) | Entrega Contínua |

### 5.3 `db/` (banco de dados, PostgreSQL no Supabase)

Os scripts são numerados e rodados **nessa ordem** no SQL Editor do Supabase. Nunca se edita um script antigo: mudança = arquivo novo.

| Arquivo | O que faz | Disciplina |
|---|---|---|
| `01_schema.sql` | 9 tabelas, RLS em todas, permissões (GRANT), gatilho que cria o perfil, função `booked_slots`, view de medicamentos | Nuvem, Segurança |
| `02_seed.sql` | Dados iniciais de exemplo (medicamentos, especialidades) | — |
| `03_teste_rls.sql` | Roteiro manual de teste de isolamento entre usuários | Segurança |
| `04_auth.sql` | Grava o aceite da LGPD no perfil no momento do cadastro | Segurança (LGPD) |
| `05_postos_reais.sql` | As 15 UBS reais (gerado por script a partir de `data/unidades-sbo.json`), médicos e estoque **simulados** | SI e Tecnologias Emergentes |
| `06_agendamento.sql` | Regras do agendamento **no banco** (horário, antecedência, dias úteis, sem conflito) e notificações automáticas | Segurança, Padrões |
| `07_lembretes.sql` | Validações dos lembretes | — |
| `08_bi.sql` | Papel de administrador, **correção de escalada de privilégio**, função `bi_dashboard` (só números agregados) | BI, Segurança |
| `09_perfil.sql` | Validações de telefone, data de nascimento e nome | Segurança |
| `ci/00_supabase_stub.sql` | Simula partes do Supabase num PostgreSQL comum (usado no CI) | Entrega Contínua |
| `ci/tests.sql` | **Testes automáticos do banco**: RLS, regras, validações, BI (cada um falha o CI se quebrar) | Segurança, Entrega Contínua |
| `demo/demo_data.sql` | 40 usuários e ~420 consultas **fictícias** para o painel de BI na apresentação | BI |
| `demo/remove_demo_data.sql` | Apaga todos os dados de demonstração | BI |

### 5.4 Dados e scripts

| Arquivo | O que é |
|---|---|
| `data/unidades-sbo.json` | As 15 UBS reais: nome, endereço, telefone, horário, serviços, coordenadas |
| `data/triagem/treino.csv` / `teste.csv` | Frases **sintéticas** (`texto;especialidade`) usadas para treinar e testar a IA |
| `scripts/geocode-unidades.mjs` | Busca as coordenadas das UBS no OpenStreetMap |
| `scripts/gerar-sql-unidades.mjs` | Gera o `db/05_postos_reais.sql` a partir do JSON |
| `scripts/treinar-triagem.mjs` | Treina o modelo e gera o relatório de avaliação |

### 5.5 `docs/` (matéria-prima do texto)

| Pasta/arquivo | Conteúdo | Uso no TCC |
|---|---|---|
| `decisions/ADR-001` a `ADR-016` | **Uma decisão técnica por arquivo**: contexto, decisão, alternativas, consequências | Capítulo de desenvolvimento; justificar escolhas |
| `features/F01` a `F14` | **Uma ficha por funcionalidade**: requisito, disciplina, arquivos, como testar | Requisitos e resultados |
| `diagrams/README.md` | **Índice de todos os diagramas com as imagens** (SVG para o Word/PDF, PNG para slides em `diagrams/imagens/`) | Todo o TCC |
| `diagrams/casos-de-uso.md` | Casos de uso (atores e funcionalidades) | Requisitos |
| `diagrams/navegacao.md` | Mapa de telas e rotas | Desenvolvimento |
| `diagrams/classes-dominio.md` | Classes do domínio e interfaces dos repositórios | Modelagem |
| `diagrams/sequencias.md` | Sequências: agendar, triagem, assistente, painel de BI, lembrete | Desenvolvimento |
| `diagrams/estados-e-atividades.md` | Estados da consulta e do lembrete; atividades de agendamento e cadastro | Modelagem |
| `diagrams/ia-triagem.md` | Pipeline de treino e de uso da IA, com exemplo real do cálculo | IA |
| `diagrams/bi-e-seguranca.md` | Fluxo de dados do BI, camadas de segurança, RLS, correção de privilégio | BI, Segurança |
| `diagrams/ci-cd.md` | Pipeline de CI/CD e ciclo de uma mudança | Entrega Contínua |
| `diagrams/iot-proposta.md` | Caixa de remédios com MQTT (**proposta, não implementada**) | IoT |
| `diagrams/arquitetura.md` | Visão geral, camadas e implantação | Arquitetura, Nuvem |
| `diagrams/modelo-er.md` | Modelo de dados (ER) e regras de acesso | Banco de dados |
| `diagrams/fluxo-autenticacao.md` | Fluxo de cadastro/login com LGPD | Segurança |
| `diagrams/padroes-de-projeto.md` | Repository, Factory, Observer, Strategy, Chain of Responsibility | Padrões de Projeto |
| `security/testes-rls.md` | Controles de segurança e 27 casos de teste | Segurança |
| `data/fontes-unidades.md` | Fontes oficiais das UBS, divergências e o que é simulado | Metodologia e limitações |
| `ml/avaliacao-triagem.md` | Métricas da IA (validação cruzada, matriz de confusão, limitações) | IA, Estatística |
| `PROGRESSO.md` | Diário de todas as sessões de desenvolvimento | Metodologia, cronograma |
| `evidence/` | **Onde vocês salvam os prints** | Apêndices |

### 5.6 Mapa ADR e ficha por assunto

| ADR | Decisão | Ficha |
|---|---|---|
| 001 | Stack do front-end | — |
| 002 | Do protótipo Figma Make para código | — |
| 003 | Padrão Repository | F01, F03 |
| 004 | Supabase como backend na nuvem | F02 |
| 005 | Leaflet e OpenStreetMap | F06 |
| 006 | CI com GitHub Actions | F11 |
| 007 | Variáveis de ambiente e chaves | — |
| 008 | Autenticação e LGPD | F04 |
| 009 | PWA e Vercel | F05 |
| 010 | Navegação por rotas | F07 |
| 011 | Agendamento: regras no banco e Factory | F08 |
| 012 | Observer para lembretes e notificações | F09 |
| 013 | Strategy para filtros | F10 |
| 014 | Triagem por IA no aparelho | F12 |
| 015 | Perfil real e painel de BI | F13 |
| 016 | Assistente em camadas (Chain of Responsibility) | F14 |

---

## 6. Telas e funcionalidades

| Tela | Endereço | Arquivo (`src/app/components/screens/`) | Ficha |
|---|---|---|---|
| Boas-vindas e apresentação (3 passos) | `/`, `/onboarding/1..3` | `Welcome`, `Onboarding1-3` | — |
| Entrar / Cadastro (aceite LGPD obrigatório) | `/entrar`, `/cadastro` | `Login`, `Signup` | F04 |
| Início | `/inicio` | `Home` | — |
| Medicamentos e detalhe | `/medicamentos`, `/medicamentos/:id` | `MedicationList`, `MedicationDetail` | F01 |
| Postos (lista + mapa), detalhe e filtros | `/postos`, `/postos/:id`, `/postos/filtros` | `PostosList`, `PostoDetail`, `MapFilters` | F06, F10 |
| Agendar (especialidade → médico → horário → confirmado) | `/agendar`, `/agendar/medico`, `/agendar/horario`, `/agendar/confirmado` | `ScheduleSpecialty`, `ScheduleDoctor`, `ScheduleDateTime`, `AppointmentConfirmed` | F08 |
| Histórico e cancelar | `/historico`, `/consultas/cancelar` | `History`, `CancelAppointment` | F08 |
| Lembretes e novo lembrete | `/lembretes`, `/lembretes/novo` | `RemindersList`, `CreateReminder` | F09 |
| Notificações | `/notificacoes` | `Notifications` | F09 |
| Perfil | `/perfil` | `Profile` | F13 |
| **Triagem (qual especialista?)** | `/triagem` | `Triage` | F12 |
| **Painel de BI** (só administrador) | `/painel` | `Dashboard` | F13 |
| **Assistente** | `/assistente` + botão azul redondo | `Assistant` (+ `shared/AssistantFab`) | F14 |

---

## 7. O que o TCC entrega em cada disciplina do 2º ano

Para cada disciplina: **o que fizemos**, **onde está** (para citar) e **evidência** (print a anexar). Os números de print se referem à seção 8.

### 7.1 Projeto Integrador II

- **O que fizemos:** o produto inteiro, do protótipo no Figma Make até o app publicado; planejamento por tarefas (T0 a T13), trabalho em dupla com divisão código/texto, diário de sessões, decisões registradas.
- **Onde está:** `docs/PROGRESSO.md` (cronograma real, sessão a sessão), todos os ADRs, `CONTEXTO-IA.md` (como a equipe usou IA como ferramenta de apoio, com regras), `README.md`.
- **Para o texto:** problema, objetivos, metodologia (entregas incrementais, cada uma com teste e documentação), resultados, conclusão.
- **Evidência:** prints de todas as telas (P01 a P25), histórico de commits (P30).

### 7.2 Modelagem de Padrões de Projetos

Cinco padrões, cada um resolvendo um problema real do app:

| Padrão | Problema que resolve | Onde | ADR |
|---|---|---|---|
| **Repository** | Telas não podem depender do banco; testar sem internet | `src/app/repositories/` | 003 |
| **Factory** | Três tipos de agendamento (consulta, retorno, exame) com regras diferentes | `features/scheduling/AppointmentFactory.ts` | 011 |
| **Observer** | Várias partes da tela precisam saber quando chega notificação ou muda lembrete | `features/notifications/NotificationBus.ts` | 012 |
| **Strategy** | Filtros e ordenações combináveis dos postos | `features/units/filters/` | 013 |
| **Chain of Responsibility** | Chatbot em camadas: cada camada tenta responder e passa adiante | `features/assistant/` | 016 |

- **Evidência:** imagens `padroes-de-projeto-*.svg` e `sequencias-05-*` em `docs/diagrams/imagens/`, trechos de código curtos dos arquivos acima.

### 7.3 Programação Multi Plataforma

- **O que fizemos:** um único código roda no computador e no celular como **PWA** (instalável na tela inicial, abre em tela cheia, funciona com cache da interface); layout responsivo (moldura de iPhone só em tela grande); geolocalização do aparelho ("Perto de mim"); mapa; rotas com botão voltar do celular funcionando.
- **Onde está:** `vite.config.ts` (PWA), `public/` (ícones), `App.tsx` (layout), `features/navigation/`, `features/units/`. ADR-001, 005, 009, 010; F05, F06, F07.
- **Evidência:** app instalado no celular (P26), ícone na tela inicial (P27), mesma tela no PC e no celular (P28).
- **Limitação a citar:** iOS fora do escopo; APK com Capacitor ficou como trabalho futuro.

### 7.4 Inteligência Artificial e Aprendizado de Máquina

- **O que fizemos:** triagem "sintoma → especialidade" com um classificador **Naive Bayes multinomial** escrito do zero, treinado e avaliado pela equipe, rodando **no aparelho** (sem API paga e sem enviar dado de saúde para terceiros).
- **Pipeline de ML para descrever:** dados rotulados (CSV) → pré-processamento (minúsculas, sem acentos, sem stopwords, raiz simples, bigramas) → treino → escolha do hiperparâmetro alfa por **validação cruzada estratificada de 5 dobras** → avaliação em conjunto de teste separado → modelo exportado em JSON → uso no app.
- **Camadas de segurança (importante na banca):** regras de emergência **antes** do modelo; Pediatria só se a frase fala de criança; confiança baixa → "Clínico Geral por precaução"; resultado mostrado como compatibilidade alta/média/baixa, nunca percentual; aviso "não é diagnóstico".
- **Onde está:** `features/triage/`, `data/triagem/`, `scripts/treinar-triagem.mjs`, `docs/ml/avaliacao-triagem.md`, ADR-014, F12. O chatbot (ADR-016) reaproveita a triagem.
- **Evidência:** P13 a P15 (telas), P31 (saída do script de treino), tabela e matriz de confusão do `avaliacao-triagem.md`.

### 7.5 Sistemas Distribuídos Aplicados a Internet das Coisas

- **Situação honesta:** **não há componente de IoT implementado.** O app em si é um sistema distribuído (cliente PWA ↔ API do Supabase ↔ PostgreSQL na nuvem ↔ servidores de mapa do OpenStreetMap ↔ CDN da Vercel), e isso pode ser descrito.
- **O que dá para escrever sem código novo:** arquitetura cliente-servidor e serviços na nuvem (`diagrams/arquitetura.md`, diagrama de implantação); comunicação via HTTPS/REST; sincronização de estado e o padrão Observer como base de sistemas orientados a eventos; uma proposta de **caixa de remédios inteligente** (sensor de abertura publicando via MQTT, alimentando os lembretes) como trabalho futuro, já desenhada em `diagrams/iot-proposta.md`.
- **Se a disciplina exigir algo funcionando:** a opção planejada (prioridade baixa) é uma caixa de remédios **simulada** publicando via MQTT. Combinar com quem programa e com o professor antes; é a única disciplina sem entrega prática.

### 7.6 Computação em Nuvem

- **O que fizemos:** backend como serviço (**Supabase**: PostgreSQL gerenciado, autenticação, API automática) na região São Paulo; front hospedado na **Vercel** (CDN, deploy automático a cada push na `main`); configuração por variáveis de ambiente.
- **Onde está:** `db/`, `lib/supabase.ts`, `repositories/supabase/`, `vercel.json`, ADR-004, 007, 009; F02, F03, F05.
- **Para o texto:** modelos de serviço (BaaS/PaaS), por que não montar servidor próprio, custos (planos gratuitos), limitação do plano gratuito da Vercel com repositório privado.
- **Evidência:** tabelas no painel do Supabase (P32, pedir ao dono), deploy na Vercel (P33), app no ar pelo link público.

### 7.7 Integração e Entrega Contínua

- **O que fizemos:** pipeline no **GitHub Actions** a cada push/PR na `main`, com 2 jobs:
  - **App:** instala, checa tipos, roda os 104 testes, gera o build.
  - **Database:** sobe um PostgreSQL 16, aplica os scripts 01 a 09, roda `db/ci/tests.sql` (RLS, regras, BI) e testa a carga e remoção dos dados de demonstração.
  - Deploy contínuo pela Vercel.
- **Fato interessante para o texto:** o CI **pegou um erro real** — um caractere digitado por engano no `06_agendamento.sql` deixou os runs #1 e #2 vermelhos; o #3, depois da correção, ficou verde. Os testes de banco também foram validados "por mutação" (quebrou-se a regra de propósito para ver o teste falhar).
- **Onde está:** `.github/workflows/ci.yml`, `vitest.config.ts`, `**/*.test.tsx`, `db/ci/`, ADR-006, F11.
- **Evidência:** P34 (lista de runs com verde e vermelho), P35 (detalhe do job Database), P36 (`npm test` no terminal).

### 7.8 Segurança e Defesa Cibernética

- **O que fizemos:**
  - **RLS** (segurança por linha) em todas as tabelas: cada pessoa só lê os próprios dados, garantido pelo banco.
  - Privilégio mínimo (GRANT) e catálogo somente leitura.
  - Regras de negócio validadas no servidor (o app não consegue burlar).
  - **LGPD:** aceite obrigatório no cadastro gravado com data; dados de saúde digitados na triagem/chatbot não saem do aparelho nem são gravados; painel só com dados agregados (minimização).
  - Chaves fora do código (`.env`), nunca a chave `service_role` no front.
  - **Correção de escalada de privilégio:** antes do `08_bi.sql`, um usuário podia alterar qualquer coluna do próprio perfil (inclusive se tornar administrador ou apagar o aceite da LGPD). Agora só nome, telefone e nascimento podem ser alterados, e um teste automático garante isso.
  - Lição aprendida: uma anotação de senha chegou a ser versionada; foi removida e a senha deve ser trocada (histórico do Git guarda tudo).
- **Onde está:** `db/01`, `04`, `06`, `08`, `09`, `db/ci/tests.sql`, `docs/security/testes-rls.md`, ADR-007, 008, 011, 015; F02, F04.
- **Evidência:** políticas RLS no Supabase (P37, pedir ao dono), teste com 2 contas (P38), "Acesso restrito" no painel para usuário comum (P22), tela de cadastro com aceite (P03).
- **Tarefa de vocês:** preencher a coluna de resultado em `docs/security/testes-rls.md` com o teste no Supabase real.

### 7.9 Business Intelligence e Big Data

- **O que fizemos:** painel de indicadores para o gestor (`/painel`): KPIs (consultas, taxa de cancelamento, consultas futuras, usuários, aceite LGPD, lembretes), consultas por semana, por especialidade, por hora, por unidade, estoque por unidade e medicamentos mais em falta; filtro de período (7, 30, 90 dias, 1 ano); exportação CSV (abre no Excel).
- **Como os dados chegam:** uma função no banco (`bi_dashboard`) agrega tudo e devolve só números (sem nome, e-mail ou id de paciente). Só administrador acessa.
- **Para o texto:** ciclo de BI (fonte → agregação → visualização → decisão), exemplos de decisões que o gestor tomaria (reforçar horário de pico da manhã, repor medicamento em falta), por que agregar protege a privacidade; "Big Data" fica no nível conceitual (o volume do projeto é pequeno).
- **Atenção:** os números da apresentação vêm de **dados de demonstração** (`db/demo/`) e devem ser identificados assim.
- **Evidência:** P20 a P21 (painel), P23 (CSV no Excel).

### 7.10 Sistemas de Informação e Tecnologias Emergentes

- **O que fizemos:** um sistema de informação para saúde pública municipal usando tecnologias recentes: PWA, backend serverless/BaaS, IA embarcada no aparelho (*on-device*), dados abertos (páginas da Prefeitura e OpenStreetMap), chatbot.
- **Para o texto:** fundamentação (SI no setor público, saúde digital/SUS, transformação digital), comparação com apps existentes (ex.: Meu SUS Digital), a decisão de IA local versus LLM em nuvem (ADR-014 e 016) como discussão de tecnologia emergente com responsabilidade.
- **Onde está:** `docs/data/fontes-unidades.md`, ADR-002, 004, 009, 014, 016.

### 7.11 Estatística Aplicada

- **Já feito:** a avaliação do modelo de IA usa estatística: média e **desvio padrão** da acurácia na validação cruzada, precisão e revocação por classe, matriz de confusão (`docs/ml/avaliacao-triagem.md`).
- **Falta (tarefa T13, de vocês):** **pesquisa de usabilidade SUS** (System Usability Scale).
  1. 15 a 30 participantes usam o app pelo link da Vercel com um roteiro curto (ex.: achar um remédio, achar um posto aberto, agendar e cancelar uma consulta, usar a triagem).
  2. Respondem as 10 afirmações padrão do SUS (escala 1 a 5) num Google Forms, mais perfil (idade, uso de celular).
  3. Cálculo: itens ímpares = resposta − 1; itens pares = 5 − resposta; soma × 2,5 = nota de 0 a 100 por pessoa.
  4. Análise descritiva: média, mediana, desvio padrão, mínimo/máximo, intervalo de confiança de 95% da média, histograma; comparar com a referência de 68 pontos (média geral do SUS).
  5. Registrar em `docs/` (ex.: `docs/usabilidade/resultado-sus.md`) com a planilha anexada. Não guardar nome nem e-mail dos participantes (LGPD); pedir consentimento no início do formulário.

### 7.12 Língua Inglesa II

- **Já feito:** `README.md` da raiz inteiro em inglês (descrição, tecnologias, como rodar, CI).
- **Falta:** o **abstract** do TCC (resumo em inglês). Pode partir da seção 2 deste guia e do README.

---

## 8. Roteiro de evidências (prints)

Salvem em `docs/evidence/` com o nome sugerido. **Celular:** prefiram o app pelo link da Vercel (dados reais). **PC:** `npm run dev` no modo Mock serve para telas que não dependem dos dados reais. Antes de cada print, confiram que não aparece senha, chave, e-mail pessoal de terceiros ou dados de outras pessoas.

### Telas do app

| Nº | Arquivo | Como chegar |
|---|---|---|
| P01 | `p01-boas-vindas.png` | Abrir o app deslogado |
| P02 | `p02-onboarding.png` | "Começar" na tela inicial |
| P03 | `p03-cadastro-lgpd.png` | Cadastro, mostrando a caixa de aceite dos termos |
| P04 | `p04-login.png` | Entrar |
| P05 | `p05-inicio.png` | Tela inicial depois do login (com o botão do assistente) |
| P06 | `p06-medicamentos.png` | Medicamentos, com uma busca digitada |
| P07 | `p07-medicamento-detalhe.png` | Tocar num medicamento |
| P08 | `p08-postos-lista.png` | Postos |
| P09 | `p09-postos-mapa.png` | Postos → Mapa |
| P10 | `p10-postos-filtros.png` | Postos → Filtros, com algumas opções marcadas |
| P11 | `p11-posto-detalhe.png` | Tocar num posto |
| P12 | `p12-agendar-especialidade.png` | Agendar Consulta |
| P13 | `p13-triagem-sugestao.png` | Triagem: "dor de dente que piora à noite" |
| P14 | `p14-triagem-emergencia.png` | Triagem: "dor forte no peito" |
| P15 | `p15-triagem-precaucao.png` | Triagem: "não sei explicar direito" |
| P16 | `p16-agendar-horario.png` | Escolher médico → tela de data e hora |
| P17 | `p17-agendamento-confirmado.png` | Confirmar um horário |
| P18 | `p18-historico-cancelar.png` | Histórico → cancelar uma consulta |
| P19 | `p19-lembretes.png` | Lembretes (com 1 ou 2 criados) e Novo lembrete |
| P20 | `p20-painel-kpis.png` | Perfil → Painel de BI (administrador), topo |
| P21 | `p21-painel-graficos.png` | Painel rolado até os gráficos |
| P22 | `p22-painel-acesso-restrito.png` | Abrir `/painel` com usuário comum |
| P23 | `p23-csv-excel.png` | Botão CSV → abrir no Excel |
| P24 | `p24-perfil-edicao.png` | Perfil → Editar (com erro de telefone e depois salvo) |
| P25 | `p25-assistente.png` | Assistente: "Onde tem Losartana?" e "estou com dor no peito" |
| — | `p25b-notificacoes.png` | Notificações (depois de agendar e cancelar) |

> **Painel com números:** o painel só tem dados se o dono rodar `db/demo/demo_data.sql` antes. No modo Mock, entre com e-mail começando por `admin`.

### Celular, nuvem, segurança e CI

| Nº | Arquivo | Como obter |
|---|---|---|
| P26 | `p26-instalar-pwa.png` | Celular Android, Chrome → menu → "Instalar app" |
| P27 | `p27-icone-tela-inicial.png` | Ícone do InfoMed na tela inicial do celular |
| P28 | `p28-pc-e-celular.png` | Mesma tela lado a lado (PC e celular) |
| P30 | `p30-commits.png` | GitHub → Commits |
| P31 | `p31-treino-ia.png` | Terminal: `node scripts/treinar-triagem.mjs` |
| P32 | `p32-supabase-tabelas.png` | Supabase → Table Editor (**dono**) |
| P33 | `p33-vercel-deploy.png` | Vercel → Deployments (**dono**) |
| P34 | `p34-ci-runs.png` | GitHub → Actions (runs verde e vermelhos) |
| P35 | `p35-ci-job-database.png` | Abrir o run verde → job Database → passo "Run database tests" |
| P36 | `p36-npm-test.png` | Terminal: `npm test` com "104 passed" |
| P37 | `p37-politicas-rls.png` | Supabase → Authentication → Policies (**dono**) |
| P38 | `p38-teste-duas-contas.png` | Duas contas: uma não vê as consultas da outra |

---

## 9. Números prontos para citar no texto

| Item | Valor | Fonte |
|---|---|---|
| UBS reais cadastradas | 15 (UBS Vista Alegre excluída: fechada desde 2020) | `data/unidades-sbo.json`, `docs/data/fontes-unidades.md` |
| Telas | 25 | `src/app/components/screens/` |
| Tabelas no banco | 9, todas com RLS | `db/01_schema.sql` |
| Scripts SQL | 9 numerados + CI + demonstração | `db/` |
| Testes automatizados do app | 104 (9 arquivos) | `npm test` |
| Casos de segurança documentados | 27 | `docs/security/testes-rls.md` |
| Decisões registradas | 16 ADRs | `docs/decisions/` |
| Fichas de funcionalidade | 14 | `docs/features/` |
| Padrões de projeto | 5 (Repository, Factory, Observer, Strategy, Chain of Responsibility) | `docs/diagrams/padroes-de-projeto.md` |
| IA: dados | 224 frases de treino + 56 de teste, 4 especialidades, sintéticas | `data/triagem/` |
| IA: validação cruzada (medida principal) | **83,5% ± 3,0%** (5 dobras, alfa = 1) | `docs/ml/avaliacao-triagem.md` |
| IA: teste separado | 98,2% (55 de 56) — otimista, ver limitações | idem |
| IA: tamanho do modelo | ~33 kB, vocabulário de 977 termos | idem |
| Chatbot: custo por mensagem | zero (sem API externa) | ADR-016 |
| Dados de demonstração | 40 usuários, ~420 consultas fictícias | `db/demo/demo_data.sql` |

---

## 10. Limitações (precisam aparecer no TCC)

- **Estoque de medicamentos por unidade e médicos são simulados.** Não existe fonte pública com esses dados. As UBS (nome, endereço, horário, telefone, serviços) são reais, das páginas da Prefeitura.
- Quatro UBS têm endereço divergente entre fontes (Jd. Esmeralda, Romano, Jd. São Francisco, Zona Sul) e precisam ser conferidas.
- O horário de funcionamento assume segunda a sexta (a fonte não informa fins de semana).
- **Triagem:** modelo simples, treinado com dados sintéticos; em relatos reais acerta menos; **não é diagnóstico**. Regras de emergência por palavras podem não reconhecer todas as formas de escrever.
- **Chatbot:** entende só os assuntos previstos; não usa modelo de linguagem (LLM) — registrado como trabalho futuro.
- **Lembretes** só avisam com o app aberto; notificação com o app fechado (push) e APK ficaram para trabalho futuro; iOS fora do escopo.
- O app não registra comparecimento: consulta passada aparece como "Realizada".
- O painel de BI na apresentação usa dados fictícios de demonstração.
- O mapa usa os servidores públicos do OpenStreetMap (adequado para demonstração, não para muito tráfego).
- Proteção das telas no navegador não é segurança: quem protege os dados é o banco (RLS).
- Não há componente de IoT implementado (seção 7.5).

---

## 11. O que ainda falta e de quem é

| # | Tarefa | Responsável | Prioridade |
|---|---|---|---|
| 1 | Rodar `db/06` a `db/09` no Supabase, promover o administrador, carregar os dados de demonstração antes da apresentação | Dono (código) | Alta |
| 2 | Trocar a senha do banco no Supabase (ficou no histórico do Git) | Dono | Alta |
| 3 | Prints de evidência (seção 8) | Documentação (P32, P33, P37: pedir ao dono) | Alta |
| 4 | Teste com 2 contas e preencher `docs/security/testes-rls.md` | Os dois | Alta |
| 5 | Pesquisa SUS (seção 7.11) | Documentação | Alta |
| 6 | Abstract em inglês | Documentação | Média |
| 7 | Conferir os 4 endereços divergentes das UBS | Qualquer um | Média |
| 8 | Proteger a `main` exigindo os 2 jobs do CI | Dono | Baixa |
| 9 | Definir com o professor o que entregar em IoT (seção 7.5) | Os dois | Média |
| 10 | Texto do TCC | Documentação | Alta |

---

## 12. Sugestão de estrutura do texto do TCC

| Capítulo | Conteúdo | De onde tirar |
|---|---|---|
| Resumo / Abstract | Problema, solução, tecnologias, resultados (IA, SUS, testes) | Seções 2 e 9 deste guia, `README.md` |
| 1. Introdução | Contexto (SUS em Santa Bárbara d'Oeste), problema, objetivos geral e específicos, justificativa | Seção 2 |
| 2. Fundamentação teórica | Saúde digital e SUS; PWA; computação em nuvem/BaaS; segurança e LGPD; padrões de projeto; Naive Bayes; BI; CI/CD; IoT (conceitual) | Seção 7 + ADRs |
| 3. Metodologia | Desenvolvimento incremental (T0 a T13), uso de IA como apoio, coleta de dados das UBS, dados simulados, avaliação (testes, ML, SUS) | `PROGRESSO.md`, `fontes-unidades.md`, `avaliacao-triagem.md` |
| 4. Desenvolvimento | Requisitos (fichas F01-F14), arquitetura, modelo de dados, padrões, segurança, IA, BI, CI | Fichas, diagramas, ADRs |
| 5. Resultados | Telas (prints), métricas da IA, resultado da pesquisa SUS, pipeline, testes de segurança | Seções 8 e 9 |
| 6. Considerações finais | O que foi atingido, limitações (seção 10), trabalhos futuros (push, APK, LLM, IoT, estoque real) | Seções 10 e 11 |
| Apêndices | Prints, matriz de confusão, questionário SUS, scripts SQL principais | `docs/evidence/`, `docs/ml/` |

**Dica:** cada ADR já está no formato "contexto → decisão → alternativas → consequências", que vira quase direto um parágrafo de justificativa técnica. Cada ficha já diz qual requisito atende e qual disciplina cobre.

---

## 13. Glossário

| Termo | Significado |
|---|---|
| **ADR** | *Architecture Decision Record*: registro de uma decisão técnica |
| **API** | Interface pela qual o app conversa com outro sistema (aqui, o Supabase) |
| **BaaS** | *Backend as a Service*: banco, login e API prontos na nuvem (Supabase) |
| **Build** | Versão otimizada do app gerada para publicar |
| **CI/CD** | Integração/entrega contínua: testes e publicação automáticos a cada mudança |
| **Commit / push** | Salvar uma versão no Git / enviar para o GitHub |
| **CSV** | Planilha em texto, abre no Excel |
| **LGPD** | Lei Geral de Proteção de Dados (Lei 13.709/2018) |
| **LLM** | Modelo de linguagem grande (tipo ChatGPT); não usado no app |
| **Mock** | Implementação "de mentira" usada em testes e demonstração |
| **Naive Bayes** | Algoritmo de classificação de texto baseado em probabilidades das palavras |
| **PWA** | *Progressive Web App*: site que se instala como aplicativo |
| **Repository** | Padrão que separa as telas do acesso aos dados |
| **RLS** | *Row Level Security*: o banco filtra as linhas que cada usuário pode ver |
| **SUS (escala)** | *System Usability Scale*: questionário de 10 itens que mede usabilidade (0 a 100). Não confundir com o Sistema Único de Saúde |
| **Supabase** | Serviço de nuvem com PostgreSQL, login e API |
| **UBS** | Unidade Básica de Saúde (posto de saúde) |
| **Validação cruzada** | Treinar e testar o modelo várias vezes trocando a parte dos dados usada para teste; dá uma medida mais confiável |
| **Vercel** | Serviço que hospeda o site e publica a cada push |
