# InfoMed: relatório final de desenvolvimento e o que falta

*Gerado em 18/11/2026 para ser entregue ao Claude Code local. Leia primeiro `CONTEXTO-IA.md` e `docs/PROGRESSO.md` do repositório: eles são a fonte da verdade sobre o código.*

## 0. Aviso importante sobre o estado real

- **Entregue e confirmado pelo dono (rodou no PC, celular e CI):** tudo até a **T10** (pacote `infomed-parte10-filtros-ci.zip`), incluindo o pipeline verde no GitHub.
- **NÃO entregue ao dono:** T11 (triagem por IA), T12 (painel de BI e Perfil real) e o chatbot. Eu comecei a escrever esses itens no ambiente de trabalho, mas **o ambiente foi reiniciado e o código foi perdido antes de ser empacotado**. Nenhum arquivo dessas três frentes está no repositório do dono. Eles precisam ser **(re)implementados** seguindo as especificações das seções 3, 4 e 5.
- Tudo o que está nas seções 3 a 5 que eu descrevo como "testado" refere-se a validações que fiz em ambiente temporário e perdido. Trate como **especificação**, não como código existente. Rode `npm run typecheck && npm test && npm run build` a cada etapa.

## 1. Projeto

App de saúde pública digital (PWA) para **Santa Bárbara d'Oeste (SP)**: medicamentos por unidade, postos com mapa, agendamento, lembretes e notificações. TCC em dupla (Sistemas, 2º ano), prazo de cerca de 1 mês a partir de 20/10/2026. Prioridade: pouco escopo, bem estruturado e documentado.

Stack (não trocar sem ADR): React 18, Vite, TypeScript, Tailwind v4, Supabase (Postgres, Auth, RLS), Leaflet 1.9 + react-leaflet 4.2, react-router 7 (a 8 exige React 19), Vitest 3, vite-plugin-pwa, GitHub Actions, Vercel. Windows + VS Code. Projeto em `C:\projetos\InfoMed`, **fora do OneDrive**.

Regras de arquitetura: telas nunca acessam o Supabase direto (interface em `repositories/`, Mock e Supabase, escolhidos só em `repositories/index.ts`); sem `any` novo; mudança no banco = novo arquivo numerado em `db/` (nunca editar o 01); toda tabela de dados pessoais com RLS; nunca usar a chave service_role nem versionar `.env`; interface em português com o visual do Figma; tela nova = entrada em `routes.ts` + `<Route>` em `AppRoutes.tsx`; testes sempre em modo Mock (`vitest.config.ts` zera as variáveis do Supabase); cada decisão vira ADR e cada feature vira ficha.

## 2. O que existe e está confirmado (T0 a T10)

| Item | Resumo |
|---|---|
| Base | Export do Figma Make limpo (package.json, imports), TypeScript, git/GitHub, Vercel com PWA e `vercel.json` (SPA fallback) |
| Repository | Medication, Auth, HealthUnit, Appointment, Notification, Reminder (Mock + Supabase) |
| Banco | `db/01` a `db/07`: 9 tabelas com RLS, view `medications_with_status`, `booked_slots`, gatilhos de agendamento e notificação, validações de lembretes, 15 UBS reais de Santa Bárbara d'Oeste (`05_postos_reais.sql`, gerado por `scripts/`; estoque e médicos **simulados**) |
| Auth + LGPD | Cadastro com aceite obrigatório gravado em `profiles.lgpd_consent_at`; "Confirm email" desligado no Supabase para a demonstração |
| Postos | Lista, detalhe, mapa Leaflet carregado sob demanda, "Perto de mim", aberto/fechado em fuso de São Paulo |
| Rotas | react-router, URLs em português, voltar, link direto, F5, proteção de rotas |
| Agendamento | Padrão **Factory** (`AppointmentFactory`), regras também no banco, histórico e cancelamento |
| Lembretes e notificações | Padrão **Observer** (`EventBus`), alerta "Hora do remédio" só com o app aberto |
| Filtros | Padrão **Strategy** (4 filtros e 2 ordenações) |
| CI | `.github/workflows/ci.yml` com jobs App e Database (PostgreSQL de serviço + `db/ci/00_supabase_stub.sql` + `db/ci/tests.sql`) |
| Docs | ADR-001 a ADR-013, fichas F01 a F11, diagramas, `security/testes-rls.md`, `README.md` em inglês, `CONTEXTO-IA.md`, `PROGRESSO.md` |
| Testes | 50 testes de aplicação passando; testes de banco validados por mutação |

## 3. T11: triagem por IA (sintoma para especialidade) — A FAZER

**Decisão:** sem chave de API e sem Supabase CLI, então o modelo roda **no aparelho**, sem custo de tokens e sem enviar dados de saúde a terceiros.

- Classificador **Naive Bayes multinomial** em JavaScript puro (`src/app/features/triage/classifier.mjs`, usado pelo app e pelo script de treino). Tokens: minúsculas, sem acentos, sem stopwords, raiz simples e bigramas. Alfa escolhido por validação cruzada.
- **Regra de domínio:** Pediatria só quando a frase menciona criança, bebê, filho(a) etc.; senão é descartada e o resto renormalizado.
- **Sinais de alerta antes do modelo** (`emergency.ts`, regex revisáveis): dor no peito, falta de ar, desmaio, convulsão, AVC, hemorragia etc. mostram SAMU 192 e Bombeiros 193 e **não oferecem agendamento**; risco à vida mostra CVV 188 e SAMU 192.
- Limiar de confiança 0,6: abaixo disso recomenda Clínico Geral "por precaução". Mostrar "compatibilidade alta, média ou baixa", nunca percentual.
- Dados: `data/triagem/treino.csv` e `teste.csv` (`texto;especialidade`), **sintéticos**, 4 classes (Clínico Geral, Pediatria, Ginecologia, Odontologia), cerca de 56 frases de treino por classe e 14 de teste. Script `scripts/treinar-triagem.mjs` gera `model.json` e `docs/ml/avaliacao-triagem.md` (matriz de confusão, validação cruzada, limitações).
- Resultado que eu havia obtido: validação cruzada de cerca de 78% e teste separado de cerca de 96%. **Reproduza e reporte os dois números**; a validação cruzada é a medida honesta, e o TCC deve dizer que os dados são sintéticos.
- Tela `Triage.tsx` (rota `/triagem`), cartão na Home e atalho em `ScheduleSpecialty`. O botão leva a `schedule-doctor` com `selectedSpecialty` e `selectedKind: 'consulta'`. Aviso fixo: não é diagnóstico.
- Precisa de `@types/node` (teste lê CSV) e de `resolveJsonModule` (já ativo).
- Docs: ADR-014, ficha F12, `docs/ml/`. Aviso: o desempenho em relatos reais será pior que o medido.

## 4. T12: painel de BI e Perfil real — A FAZER

**Banco (`db/08_bi.sql`, `db/09_perfil.sql`):**
- `profiles.is_admin boolean default false`. **Segurança crítica:** `revoke update on profiles from authenticated; grant update (full_name, birth_date, phone)`; sem isso qualquer usuário se promove a admin ou apaga o aceite da LGPD.
- `is_admin()` (security definer) e `bi_dashboard(p_days)` (security definer, só administrador, período 1 a 365) devolvendo **um JSON agregado**: KPIs (consultas, canceladas, próximas, usuários, com aceite, lembretes ativos), por especialidade, unidade, semana, hora, tipo, estoque por unidade e medicamentos mais indisponíveis. Nunca devolver identificadores ou e-mails.
- `09_perfil.sql`: checks de telefone (10 ou 11 dígitos), data de nascimento (1900 até hoje) e tamanho do nome.
- Promover o administrador **manualmente** no SQL Editor: `update profiles set is_admin = true where id = '<uuid>'`.
- `db/demo/demo_data.sql` e `remove_demo_data.sql`: 40 usuários `demoN@infomed.invalid` e algumas centenas de consultas fictícias para o painel. Use `WITH slots AS MATERIALIZED` (sem isso o `random()` é avaliado cedo e a distribuição por hora fica errada). Rotular tudo como DADOS DE DEMONSTRAÇÃO.
- Estender `db/ci/tests.sql` (usuário comum não executa o painel, não consegue `update is_admin`, perfil válido e inválido, admin recebe séries, JSON sem ids ou e-mails) e incluir `08_bi.sql` e `09_perfil.sql` na lista do workflow. O stub de `auth.users` precisa das colunas `email`, `aud`, `role`, `created_at`, `updated_at`.

**App:** `domain/profile.ts` e `analytics.ts`, `ProfileRepository` e `AnalyticsRepository` (Mock e Supabase), `profileUtils.ts` (formatar telefone e data, validar). `Profile.tsx` sem os dados fixos antigos ("Maria Silva", "(11) 98765-4321", contadores 12 e 4): usar dados reais, edição de nome, telefone e nascimento, data do aceite da LGPD, contadores reais e item "Painel de BI" **só para administrador**. `Dashboard.tsx` (rota `/painel`, carregada com `lazy`) com Recharts (já no `package.json`): KPIs, linha por semana, barras por especialidade e hora, pilha de estoque, exportar CSV (separador `;`, BOM). Texto: "indicadores agregados, estoque simulado".
- Docs: ADR-015, ficha F13.

## 5. Chatbot (novo pedido) — A FAZER, com custo de tokens mínimo

Objetivo do dono: um chatbot dentro do tema do TCC consumindo **poucos tokens**.

**Recomendação: arquitetura em camadas, em que o LLM é o último recurso.**
1. **Regras de alerta** (reaproveitar `emergency.ts`): emergência e risco à vida respondem na hora, sem modelo.
2. **Intenções locais, custo zero:** classificador de intenção (mesmo Naive Bayes da T11, ou palavras-chave) com respostas prontas e **ações dentro do app**: "onde tem Losartana?" (usa `unitIdsWithMedication`), "UBS aberta agora" (usa `isOpenNow` e filtros), "agendar consulta", "meus lembretes", "como cancelo", "qual especialista" (usa `analyzeSymptoms`). Respostas com botões que navegam (`navigate('postos', { unitFilters })`).
3. **FAQ local** (JSON versionado: horários, vacinas, documentos, LGPD, como usar o app) com busca por similaridade simples.
4. **LLM opcional (só se houver chave):** Edge Function do Supabase, chave **somente no servidor**, `max_tokens` baixo (cerca de 250), prompt de sistema curto e fixo, histórico limitado às 2 ou 3 últimas trocas, só para perguntas que as camadas 1 a 3 não resolveram, cache de respostas repetidas e limite de mensagens por usuário por dia (tabela de uso no banco com RLS). Sem chave configurada, o chatbot continua funcionando só com as camadas locais.
- **Nunca** dar diagnóstico, dose ou conduta; sempre o aviso "não substitui profissional de saúde". O texto digitado não deve ser gravado.
- Interface: botão flutuante e tela `/assistente` (rota nova), histórico só em memória, sugestões rápidas em chips.
- Padrão de projeto sugerido para o TCC: **Chain of Responsibility** (cada camada tenta responder e repassa) ou **Strategy** por intenção. Docs: ADR-016, ficha F14.
- Para o LLM o dono ainda não tem **chave de API** nem **Supabase CLI** (instalar: `npm i -D supabase` ou `scoop install supabase`). Se não quiser pagar, ficar nas camadas 1 a 3 e registrar o LLM como trabalho futuro.

## 6. Checklist final do TCC (lista priorizada)

1. Implementar T11, T12 e chatbot (seções 3 a 5), cada um com ADR, ficha, testes e diário.
2. **Rodar no Supabase real** os SQL pendentes (`06`, `07`, depois `08`, `09`) e repetir o isolamento com duas contas; preencher a coluna "Resultado no Supabase" em `docs/security/testes-rls.md`.
3. **Pesquisa de usabilidade (SUS), T13:** questionário com 15 a 30 pessoas usando o link da Vercel, análise descritiva (média, desvio, nota SUS), registrar em `docs/`.
4. **Evidências** em `docs/evidence/`: prints de todas as telas, pipeline verde (e um vermelho de demonstração), políticas RLS, tabelas do Supabase, app instalado no celular, painel de BI.
5. **Conferir as 4 UBS com endereço divergente** (Esmeralda, Romano, São Francisco, Zona Sul) por telefone ou mapa, e as coordenadas de todas no mapa; atualizar `data/unidades-sbo.json`.
6. **Vercel e dupla:** o plano gratuito bloqueia deploy de commits de outra conta em repositório privado (repositório público, só o dono comita na `main`, ou outra hospedagem).
7. Proteger a `main` exigindo os dois jobs do CI.
8. README e abstract em inglês (README já existe; falta o abstract do TCC), Língua Inglesa II.
9. Sistemas Distribuídos/IoT (opcional, P2): caixa de remédios simulada por MQTT. Só se sobrar tempo.
10. Texto do TCC (feito por outro integrante): usar os ADRs, fichas e diagramas.

## 7. Limitações que devem constar no TCC

- Estoque por unidade e médicos são **simulados**; unidades reais vêm das páginas da Prefeitura, e a UBS Vista Alegre foi excluída (fechada desde 2020, segundo reportagem de 2026).
- Lembretes só tocam com o app aberto (PWA); push em segundo plano e APK com Capacitor ficam como trabalho futuro; iOS fora do escopo.
- O app não registra comparecimento (consulta ativa passada aparece como "Realizada").
- A triagem é um modelo simples treinado com dados sintéticos; não é diagnóstico.
- O mapa usa os servidores públicos do OpenStreetMap (adequado para demonstração, não para tráfego intenso).
- Proteção de rotas no cliente não é segurança: o que protege os dados é o RLS.

## 8. Prompt sugerido para colar no Claude Code local

```
Leia CONTEXTO-IA.md, docs/PROGRESSO.md e docs/README.md. Depois leia RELATORIO-FINAL-INFOMED.md.
Implemente, nesta ordem, uma por vez, com testes e documentação (ADR, ficha, PROGRESSO.md):
1) T11 triagem por IA local (seção 3), 2) T12 Perfil real + painel de BI (seção 4), 3) chatbot em camadas (seção 5).
Respeite as regras de arquitetura da seção 1. Antes de cada commit rode npm run typecheck && npm test && npm run build.
SQL novo vai em db/ numerado (08, 09...), nunca editar o 01; atualize db/ci/tests.sql e o workflow.
Não peça nem escreva chaves; não versione .env. Me diga o que precisa que EU rode no Supabase.
```
