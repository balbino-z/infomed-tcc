# ADR-015: Perfil real e painel de BI com indicadores agregados

- **Status:** Aceita (implementada em 18/11/2026)
- **Data:** 18/11/2026
- **Disciplinas relacionadas:** Business Intelligence e Big Data; Segurança e Defesa Cibernética (LGPD); Modelagem de Padrões de Projetos (Repository)

## Contexto

1. A tela Perfil ainda mostrava dados fixos do protótipo (nome, telefone, contadores) e, depois, dados pessoais digitados direto no código. Uma versão editável foi feita em 27/10 (`InfoMed-perfil-corrigido.zip`), mas não chegou ao repositório; ela foi aproveitada como base.
2. O TCC precisa de um painel de BI. Os dados das consultas são pessoais: o painel não pode expor quem marcou o quê.
3. Problema de segurança encontrado: o `01_schema.sql` dava `UPDATE` em **todas** as colunas de `profiles` ao próprio usuário. Com uma coluna `is_admin`, qualquer pessoa poderia se promover a administrador pelo console do navegador, e já era possível apagar o próprio registro de aceite da LGPD.

## Decisão

**Perfil**
- `ProfileRepository` (Mock e Supabase) com `getMine` e `updateMine`; a tela não conhece o banco.
- O usuário edita só nome, telefone e data de nascimento. `db/08_bi.sql` troca o GRANT por coluna: `revoke update on profiles` + `grant update (full_name, birth_date, phone)`.
- `db/09_perfil.sql` valida no banco: telefone com 10 ou 11 dígitos (gravado sem máscara), nascimento entre 1900 e hoje, nome até 120 caracteres. `profileUtils.ts` espelha as regras para dar mensagem clara.
- A tela mostra a data do aceite da LGPD, contadores reais (próximas consultas e lembretes ativos) e o item "Painel de BI" só para administrador.

**Painel**
- `profiles.is_admin` (padrão `false`), promovido **manualmente** no SQL Editor. O app nunca grava esse campo.
- Função `bi_dashboard(p_days)` com `security definer`: recusa quem não é administrador (`is_admin()`), aceita período de 1 a 365 dias e devolve **um único JSON agregado** (KPIs, por especialidade, unidade, semana, hora, tipo, estoque por unidade e medicamentos mais indisponíveis). Nunca devolve ids, nomes ou e-mails; um teste de banco garante isso.
- Tela `Dashboard.tsx` (rota `/painel`, carregada sob demanda) com Recharts, que já estava no `package.json`. Exporta CSV com separador `;` e BOM (abre direto no Excel em português).
- `db/demo/demo_data.sql` cria 40 usuários e ~420 consultas **fictícias** para a apresentação; `remove_demo_data.sql` apaga tudo. O CI testa as duas.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Views agregadas com GRANT para o admin | Exigiria um papel de banco separado por usuário; a função com checagem interna é mais simples e testável |
| Ferramenta externa (Metabase, Power BI) | Precisaria de acesso direto ao banco com credenciais fortes, fora do escopo e arriscado |
| Admin definido por e-mail fixo no código | Qualquer mudança exigiria deploy; e seria visível no front |
| Perfil com UPDATE em todas as colunas | Permitiria escalada de privilégio (is_admin) e apagar o aceite LGPD |

## Consequências

**Positivas**
- Indicadores úteis para gestão sem expor pacientes (minimização de dados, LGPD art. 6º, III).
- Escalada de privilégio bloqueada no banco e coberta por teste com mutação.
- Painel não pesa no carregamento do app (pacote separado de ~110 kB gzip).

**Negativas / riscos**
- `security definer` exige cuidado: qualquer mudança na função deve manter a checagem de administrador e o teste de "sem ids".
- Com poucos usuários reais os números são pequenos; para a apresentação usam-se os dados de demonstração, que precisam ser apagados depois.
- O estoque continua simulado.

## Evidências

- `db/08_bi.sql`, `db/09_perfil.sql`, `db/demo/`, casos novos em `db/ci/tests.sql`
- `src/app/components/screens/Profile.tsx`, `Dashboard.tsx`, `features/profile/`, `features/analytics/`, 10 testes
- Prints: perfil editado, painel com dados de demonstração, CSV aberto no Excel, erro ao tentar `update profiles set is_admin = true` como usuário comum
