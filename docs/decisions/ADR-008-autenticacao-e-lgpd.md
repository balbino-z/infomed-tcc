# ADR-008: Autenticação com Supabase Auth e consentimento LGPD

- **Status:** Aceita
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Segurança e Defesa Cibernética, Modelagem de Padrões de Projetos

## Contexto

O InfoMed trata dados pessoais e de saúde (consultas, medicamentos em uso, lembretes). A Lei Geral de Proteção de Dados (LGPD) exige base legal para o tratamento, e o consentimento do titular é a base adotada para o cadastro. Além disso, as políticas de RLS (ADR-004) só protegem os dados de cada pessoa quando existe um usuário autenticado identificado.

## Decisão

1. Usar o **Supabase Auth** com e-mail e senha para cadastro e login.
2. Encapsular o acesso à autenticação na interface **`AuthRepository`**, com implementações `SupabaseAuthRepository` e `MockAuthRepository`, seguindo o padrão Repository (ADR-003).
3. Expor o estado do usuário ao aplicativo por um **`AuthProvider`** (React Context) e o hook `useAuth`.
4. **Proteger as telas:** quem não está logado só acessa as telas públicas (boas-vindas, onboarding, login e cadastro); qualquer outra tela exibe o login.
5. **Consentimento LGPD no cadastro:** o formulário exige marcar a caixa de aceite. O momento do aceite é enviado nos metadados do usuário e gravado pelo gatilho do banco na coluna `profiles.lgpd_consent_at`, o que mantém o registro mesmo quando o e-mail ainda precisa ser confirmado.
6. Exigir **senha de no mínimo 8 caracteres** no aplicativo e traduzir as mensagens técnicas de erro para o usuário, sem revelar detalhes internos (por exemplo, a mensagem de falha de login não informa se foi o e-mail ou a senha que estava errado).
7. O `MockAuthRepository` existe apenas para desenvolvimento e testes sem credenciais; não é seguro e não deve ser usado em produção.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Implementar login próprio (hash de senha, tokens) | Risco alto de erros de segurança e muito trabalho para o prazo |
| Login social (Google) | Depende de configuração externa adicional; pode ser trabalho futuro |
| Cadastro sem consentimento explícito | Não atende à LGPD para dados de saúde |

## Consequências

**Positivas**
- Senhas tratadas pela plataforma (hash e proteção contra força bruta), não pelo código do projeto.
- O RLS passa a ter efeito real: cada consulta e lembrete fica vinculado ao `auth.uid()`.
- Registro auditável do consentimento por usuário.
- Fluxo de login testável automaticamente com o Mock.

**Negativas / riscos**
- Para a demonstração, a confirmação de e-mail pode ser desativada no painel; em produção ela deve permanecer ativa.
- O token de sessão fica armazenado no navegador (comportamento padrão do Supabase), o que exige cuidado contra XSS.
- Recuperação de senha e exclusão de conta (direito do titular na LGPD) ficam como trabalhos futuros.

## Evidências

- Print das telas de login e cadastro
- Print da tabela `profiles` com `lgpd_consent_at` preenchido (Table Editor)
- Print do usuário em Authentication > Users
- Resultado dos testes automatizados (`npm test`)
