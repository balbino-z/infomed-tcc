# Feature: Banco de dados na nuvem com segurança por usuário (RLS)

- **Requisito atendido (RF/RNF):** RNF - Dados pessoais de saúde devem ser acessíveis somente ao próprio titular; RNF - Dados armazenados em nuvem.
- **Disciplinas relacionadas:** Computação em Nuvem; Segurança e Defesa Cibernética
- **Padrão ou tecnologia usada e por quê:** Supabase (PostgreSQL gerenciado) com Row Level Security, pela segurança aplicada no próprio banco, sem depender apenas do código do aplicativo (ver ADR-004).
- **Arquivos principais:**
  - `db/01_schema.sql` (tabelas, políticas, gatilho, função e view)
  - `db/02_seed.sql` (dados de exemplo fictícios)
  - `db/03_teste_rls.sql` (teste de isolamento entre usuários)
- **Como testar:** executar `db/03_teste_rls.sql` com dois UUIDs de usuários de teste; o segundo usuário deve enxergar 0 consultas do primeiro.
- **Evidência (print ou diagrama):** `docs/diagrams/modelo-er.md`; prints do Table Editor, das políticas e do teste, em `docs/evidence/`.
- **Observações / dificuldades encontradas:**
  - Como o RLS filtra linhas e o GRANT libera a tabela, ambos são necessários; ambos foram configurados.
  - A view usa `security_invoker` para que as políticas do usuário que consulta sejam respeitadas.
  - Casos de teste detalhados em `docs/security/testes-rls.md`.
