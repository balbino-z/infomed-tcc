# Feature: Integração contínua (GitHub Actions) e testes do banco

- **Requisito atendido (RF/RNF):** RNF - Qualidade e manutenibilidade: toda alteração é verificada automaticamente antes de ir para o ar.
- **Disciplinas relacionadas:** Integração e Entrega Contínua; Segurança e Defesa Cibernética
- **Padrão ou tecnologia usada e por quê:** GitHub Actions com dois jobs, e testes SQL executados contra um PostgreSQL de serviço (ADR-006).
- **Arquivos principais:**
  - `.github/workflows/ci.yml`
  - `db/ci/00_supabase_stub.sql` (papéis `anon` e `authenticated` e esquema `auth` simulados)
  - `db/ci/tests.sql` (testes de RLS, regras de agendamento e validações de lembretes)
  - `package.json` (scripts `typecheck`, `test` e `build`) e `README.md`
- **Como testar:**
  1. Faça um `git push` na `main` (ou abra um Pull Request): na aba **Actions** do GitHub, o fluxo "CI" roda os jobs **App** e **Database**.
  2. Para ver falhar: introduza um erro de tipo ou apague uma regra do banco em uma branch e abra um Pull Request: o job correspondente fica vermelho.
  3. Localmente: `npm run typecheck && npm test && npm run build`.
- **Evidência (print ou diagrama):** print do pipeline verde, dos dois jobs expandidos e de uma execução vermelha de demonstração, em `docs/evidence/`.
- **Observações / dificuldades encontradas:** os testes de banco foram verificados por **mutação**: ao remover o gatilho de regras ou desligar o RLS dos lembretes, o teste falha como esperado. O CI não usa as chaves do Supabase (testes rodam em modo Mock). O deploy contínuo é feito pela Vercel a cada push na `main` (ADR-009).
