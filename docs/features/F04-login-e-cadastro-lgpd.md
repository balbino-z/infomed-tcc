# Feature: Login, cadastro e consentimento LGPD

- **Requisito atendido (RF/RNF):** RF - O usuário deve poder criar conta e entrar no aplicativo; RNF - Dados pessoais protegidos e tratados mediante consentimento (LGPD).
- **Disciplinas relacionadas:** Segurança e Defesa Cibernética; Modelagem de Padrões de Projetos
- **Padrão ou tecnologia usada e por quê:** Supabase Auth, com Repository para a autenticação e React Context para o estado do usuário (ver ADR-008).
- **Arquivos principais:**
  - `src/app/domain/user.ts`
  - `src/app/repositories/AuthRepository.ts`
  - `src/app/repositories/supabase/SupabaseAuthRepository.ts`
  - `src/app/repositories/mock/MockAuthRepository.ts`
  - `src/app/features/auth/AuthContext.tsx`
  - `src/app/components/screens/Login.tsx` e `Signup.tsx`
  - `db/04_auth.sql` (gatilho que grava o aceite da LGPD)
  - `src/app/features/auth/auth.test.tsx` (testes automatizados)
- **Como testar:**
  1. Abrir o app, passar pelo onboarding e tocar em Cadastre-se.
  2. Tentar cadastrar sem marcar o aceite: deve aparecer o erro e não cadastrar.
  3. Cadastrar com o aceite marcado: deve entrar na Home exibindo o nome do usuário.
  4. No Supabase, conferir `profiles` com `full_name` e `lgpd_consent_at` preenchidos.
  5. Em Perfil, tocar em Sair da Conta: deve voltar ao login; tentar acessar outra tela exige login.
  6. Rodar `npm test`: 4 testes devem passar.
- **Evidência (print ou diagrama):** prints em `docs/evidence/` (login, cadastro, Home com o nome, tabela `profiles`).
- **Observações / dificuldades encontradas:** as telas exportadas do Figma Make tinham o nome "Maria Silva" fixo na Home e no Perfil; foram substituídas pelos dados do usuário logado. O consentimento é gravado pelo gatilho do banco para não depender de sessão ativa no momento do cadastro.
