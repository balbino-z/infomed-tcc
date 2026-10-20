# Diário de progresso

> Uma entrada por sessão de trabalho, **a mais recente no final**. Quem começa a sessão lê as últimas entradas; quem termina escreve a sua.
> Peça ao Claude: "resuma o que fizemos no formato do PROGRESSO.md".

## Modelo de entrada

```
### Sessão N — AAAA-MM-DD — <nome de quem trabalhou>
**Tarefa:** (ex.: T3 unidades reais)
**Feito:**
- ...
**Arquivos criados/alterados:** ...
**SQL novo para rodar no Supabase:** (nenhum | db/0X_nome.sql — já rodado? sim/não)
**Testes:** tsc ok? npm test ok? build ok?
**Pendências / bloqueios:** ...
**Próximo passo sugerido:** ...
**Docs atualizados:** ADR-0XX / F0X / evidências
```

---

### Sessão 1 — 20/10/2026 — dono do repositório
**Tarefa:** Sprint 0 (base do projeto)
**Feito:**
- Planejamento: mapa matéria → entrega, escopo P0/P1/P2, cronograma de 4 semanas, stack decidida.
- Análise do export do Figma Make (20 telas) e levantamento de problemas (ADR-002).
- Ambiente: Node, Git e VS Code; projeto movido para `C:\projetos\InfoMed`.
- `package.json` reescrito (sem entradas `pacote@versão` e sem dependências não usadas); script `fix-imports.mjs` removeu versões dos imports em 41 arquivos.
- Repositório no GitHub (privado) e primeiro commit.
**Testes:** build ok; app rodando em `localhost:5173`.

### Sessão 2 — 20/10/2026 — dono do repositório
**Tarefa:** Camada de domínio e padrão Repository
**Feito:**
- `tsconfig.json`, `vite-env.d.ts`; erros de tipo zerados (inclusive correção do tipo de `navigate` em `MedicationDetail`).
- `domain/medication.ts`, `MedicationRepository`, `MockMedicationRepository`; `MedicationList` passou a usar o repositório.
- ADRs 001, 002, 003, 005, 006 e ficha F01.
**Testes:** tsc ok; busca "met" mostra só a Metformina.

### Sessão 3 — 20/10/2026 — dono do repositório
**Tarefa:** Supabase (banco e RLS)
**Feito:**
- Projeto Supabase (São Paulo); `db/01_schema.sql` (9 tabelas, RLS, GRANT, gatilho de perfil, `booked_slots`, view `medications_with_status`), `db/02_seed.sql`, `db/03_teste_rls.sql`.
- `lib/supabase.ts`, `SupabaseMedicationRepository`, `repositories/index.ts` escolhendo Mock/Supabase pelo `.env`; `.env.example`.
- ADR-004 e ADR-007; `diagrams/modelo-er.md`; `security/testes-rls.md`; fichas F02 e F03.
**SQL rodado no Supabase:** 01 e 02 (confirmado).
**Testes:** tela de Medicamentos lendo do banco (confirmado).
**Observação:** o esquema também foi validado em um PostgreSQL local com `auth` simulado (isolamento entre usuários ok); falta repetir no Supabase real com 2 contas.

### Sessão 4 — 20/10/2026 — dono do repositório
**Tarefa:** Autenticação e LGPD
**Feito (código entregue):**
- `domain/user.ts`, `AuthRepository`, `SupabaseAuthRepository`, `MockAuthRepository`, `AuthContext`.
- Telas `Login` e `Signup` (aceite LGPD obrigatório, senha mínima de 8); telas internas bloqueadas sem login; Home e Perfil mostram o nome do usuário; botão "Sair da Conta".
- `db/04_auth.sql` (gatilho grava `lgpd_consent_at`); Vitest 3 com 4 testes; ADR-008, ficha F04, `diagrams/fluxo-autenticacao.md`.
**SQL novo para rodar no Supabase:** `db/04_auth.sql` — **confirmar se já foi rodado**.
**Testes:** tsc ok, 4 testes ok, build ok (verificados fora do ambiente do usuário).
**Pendências:** testar cadastro/login no navegador com o Supabase real; desativar "Confirm email" no painel para a demonstração; teste de RLS com 2 contas; prints em `docs/evidence`.
**Próximo passo sugerido:** T1, T2 e depois T3 (unidades reais de Santa Bárbara d'Oeste).

### Sessão 5 — 20/10/2026 — dono do repositório
**Tarefa:** PWA e publicação na Vercel (antecipada em relação à fila)
**Feito (código entregue):**
- `vite-plugin-pwa` com manifesto (nome, cores, ícones, `standalone`) e service worker com atualização automática; só a interface é guardada em cache, dados do Supabase sempre pela rede.
- Ícones do app (192, 512, maskable, apple-touch, favicon) em `public/`; `index.html` com metadados de tema e iOS.
- `App.tsx`: moldura de iPhone só em telas largas (`md+`); no celular o app ocupa a tela toda (`100dvh`). Isso resolve a parte da moldura da T6; **react-router continua pendente**.
- ADR-009 (PWA e Vercel) e ficha F05.
**Testes:** tsc ok, 4 testes ok, build ok (manifesto e service worker gerados).
**Pendências:** instalar `vite-plugin-pwa` (`npm install -D vite-plugin-pwa`), publicar na Vercel com as variáveis do `.env`, ajustar URL no Supabase (Authentication → URL Configuration), testar a instalação no celular, prints em `docs/evidence`.
**Atenção:** a Vercel (plano gratuito) bloqueia deploys de commits de outras contas em repositório privado. Decidir: repositório público, só o dono comita na `main`, ou outra hospedagem.
**Próximo passo sugerido:** T3 (unidades reais de Santa Bárbara d'Oeste).

### Sessão 6 — (a preencher) — (nome)
