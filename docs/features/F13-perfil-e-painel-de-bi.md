# Feature: Perfil real e painel de BI

- **Requisito atendido (RF/RNF):** RF - O usuário vê e edita seus dados (nome, telefone, nascimento) e a data do aceite da LGPD. RF - O administrador acompanha indicadores de uso, consultas e estoque. RNF - O painel não expõe dados pessoais.
- **Disciplinas relacionadas:** Business Intelligence e Big Data; Segurança e Defesa Cibernética; Modelagem de Padrões de Projetos (Repository)
- **Padrão ou tecnologia usada e por quê:** Repository (Profile e Analytics), função `security definer` agregada, GRANT por coluna, Recharts (ADR-015).
- **Arquivos principais:**
  - `db/08_bi.sql`, `db/09_perfil.sql`, `db/demo/demo_data.sql`, `db/demo/remove_demo_data.sql`, `db/ci/tests.sql`
  - `src/app/domain/profile.ts`, `analytics.ts`; `repositories/ProfileRepository.ts`, `AnalyticsRepository.ts` (+ Mock e Supabase)
  - `src/app/features/profile/profileUtils.ts`, `features/analytics/dashboardCsv.ts`, `features/profile/profile.test.tsx`
  - `src/app/components/screens/Profile.tsx`, `Dashboard.tsx` (rota `/painel`)
- **Como testar:**
  1. Rodar `db/08_bi.sql` e `db/09_perfil.sql` no SQL Editor.
  2. Perfil → Editar: telefone "123" deve dar erro; "(19) 99999-8888" salva. O nome novo aparece também na Home.
  3. Como usuário comum, o item "Painel de BI" não aparece e `/painel` mostra "Acesso restrito".
  4. No SQL Editor: `update public.profiles set is_admin = true where id = '<seu uuid>';` (uuid em Authentication → Users). Saia e entre de novo: o item aparece.
  5. Opcional: rodar `db/demo/demo_data.sql` para ter números; trocar o período; exportar CSV e abrir no Excel. Depois `db/demo/remove_demo_data.sql`.
  6. Segurança: no console do navegador, como usuário comum, `update` em `is_admin` deve falhar (permission denied).
  7. Modo Mock (sem .env): entrar com um e-mail que comece com `admin` mostra o painel com números fictícios.
  8. `npm test`: 10 testes; CI: casos de perfil e BI em `db/ci/tests.sql` e passo de dados de demonstração.
- **Evidência (print ou diagrama):** prints em `docs/evidence/`.
- **Observações / dificuldades encontradas:** o GRANT de UPDATE em todas as colunas do perfil era uma falha latente (escalada de privilégio); corrigida no 08. Os números do painel com dados de demonstração são fictícios e devem ser identificados assim na apresentação.
