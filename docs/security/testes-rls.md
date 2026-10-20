# Testes de segurança: Row Level Security (RLS)

Disciplina: Segurança e Defesa Cibernética

## Objetivo

Comprovar que um usuário autenticado acessa somente os próprios dados e que dados pessoais não são acessíveis sem autenticação.

## Controles implementados

| Controle | Como funciona | Onde está |
|---|---|---|
| RLS em todas as tabelas | Sem política que permita, nenhuma linha é acessível | `db/01_schema.sql` |
| Isolamento por usuário | Políticas `user_id = (select auth.uid())` em consultas, lembretes, notificações e perfil | `db/01_schema.sql` |
| Catálogo somente leitura | Medicamentos, unidades, médicos, especialidades e estoque têm apenas política de `select` | `db/01_schema.sql` |
| Prevenção de falsificação | `with check` impede inserir consulta com `user_id` de outra pessoa | `db/01_schema.sql` |
| Privilégios mínimos (GRANT) | O papel `anon` não tem acesso às tabelas de dados pessoais | `db/01_schema.sql` |
| Sem dupla marcação | Índice único impede dois agendamentos ativos no mesmo horário/médico | `db/01_schema.sql` |
| Exposição controlada | A função `booked_slots` retorna só horários ocupados, sem dados de quem marcou | `db/01_schema.sql` |
| Consentimento LGPD | Campo `profiles.lgpd_consent_at` registra o aceite | `db/01_schema.sql` |

## Casos de teste

| # | Cenário | Resultado esperado | Resultado obtido |
|---|---|---|---|
| T1 | Usuário A cria uma consulta e lista suas consultas | Vê 1 consulta | (preencher) |
| T2 | Usuário B lista consultas | Vê 0 consultas (não vê as de A) | (preencher) |
| T3 | Usuário B lista lembretes de A | Vê 0 lembretes | (preencher) |
| T4 | Usuário B tenta inserir consulta com `user_id` de A | Erro: viola a política de RLS | (preencher) |
| T5 | Dois agendamentos no mesmo horário e médico | Erro: violação de unicidade | (preencher) |
| T6 | Visitante sem login lê medicamentos | Retorna a lista | (preencher) |
| T7 | Visitante sem login lê consultas | Erro: permissão negada | (preencher) |
| T8 | Usuário B consulta horários ocupados pela função | Vê só os horários, sem identificação | (preencher) |

## Como executar

1. Crie duas contas de teste (Authentication > Users > Add user) e copie o UUID de cada uma.
2. Abra `db/03_teste_rls.sql`, troque os marcadores pelos UUIDs e execute no SQL Editor.
3. Registre o resultado na tabela acima e salve o print em `docs/evidence/`.

## Observação sobre os testes já realizados

Antes da publicação, o esquema foi validado em um PostgreSQL local com um modelo simulado do `auth` do Supabase, e os casos T1 a T8 tiveram o resultado esperado. A validação definitiva deve ser repetida no projeto real do Supabase, com as contas de teste.
