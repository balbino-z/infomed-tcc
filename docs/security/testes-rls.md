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

## Testes do agendamento e dos lembretes (T9 a T27)

Executados no PostgreSQL local com o esquema `db/01` a `db/07` e dois usuários simulados (Maria e João). **Repetir no Supabase real** e registrar a coluna "Resultado no Supabase".

| # | Cenário | Resultado esperado | Resultado local | Resultado no Supabase |
|---|---|---|---|---|
| T9 | Maria agenda um horário válido | Aceito | Aceito | (preencher) |
| T10 | João tenta o mesmo médico e horário | Erro de duplicidade | Erro de duplicidade | (preencher) |
| T11 | Horário fora da grade (10:15) | Erro "30 em 30 minutos" | Erro | (preencher) |
| T12 | Antes da abertura da unidade (06:30) | Erro "fora do atendimento" | Erro | (preencher) |
| T13 | Último horário (16:00) e depois do expediente (16:30) | 16:00 aceito, 16:30 recusado | Como esperado | (preencher) |
| T14 | Horário no passado | Erro | Erro | (preencher) |
| T15 | Fim de semana | Erro "segunda a sexta" | Erro | (preencher) |
| T16 | João cria consulta em nome da Maria | Erro de RLS | Erro de RLS | (preencher) |
| T17 | João marca a própria consulta como "concluída" | Erro "Mudança de status não permitida" | Erro | (preencher) |
| T18 | João altera o horário da própria consulta | Erro "Só é permitido cancelar" | Erro | (preencher) |
| T19 | João cancela a própria consulta | Aceito; view mostra só a dele | Aceito | (preencher) |
| T20 | Notificações do João | "Consulta agendada" e "Consulta cancelada" criadas pelo servidor | Como esperado | (preencher) |
| T21 | `booked_slots` | Devolve os instantes ocupados, sem identificar quem marcou | Como esperado | (preencher) |
| T22 | Maria consulta `my_appointments` | Vê só as dela | Como esperado | (preencher) |
| T23 | Lembrete válido | Aceito | Aceito | (preencher) |
| T24 | Horário inválido (25:99) | Erro de validação | Erro | (preencher) |
| T25 | Sem nome e sem medicamento | Erro de validação | Erro | (preencher) |
| T26 | Dia da semana inválido (9) | Erro de validação | Erro | (preencher) |
| T27 | Sem horários ou sem dias | Erro de validação | Erro | (preencher) |

## Execução automática no CI

Os casos acima (isolamento entre usuários, regras do agendamento, validações dos lembretes e bloqueio de acesso anônimo) foram convertidos em testes automáticos em `db/ci/tests.sql`. Eles rodam a cada `push` e `pull request` no job **Database** do GitHub Actions (ADR-006), sobre um PostgreSQL com substitutos do Supabase. Os testes foram validados por **mutação**: remover o gatilho de regras do agendamento ou desligar o RLS dos lembretes faz o teste falhar. A execução no Supabase real continua necessária como evidência final (coluna "Resultado no Supabase").
