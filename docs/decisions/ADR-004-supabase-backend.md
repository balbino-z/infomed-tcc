# ADR-004: Supabase como backend e banco de dados na nuvem

- **Status:** Aceita (implementada em 20/10/2026)
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Computação em Nuvem, Segurança e Defesa Cibernética, Business Intelligence e Big Data

## Contexto

O aplicativo precisa de autenticação de usuários, armazenamento de dados de saúde (consultas, lembretes), consulta a medicamentos e postos, e notificações. Há um único desenvolvedor e um prazo de aproximadamente um mês, portanto escrever e hospedar uma API própria é inviável. Por tratar dados de saúde, a proteção por usuário e a conformidade com a LGPD são requisitos centrais.

## Decisão

Utilizar o **Supabase** como plataforma de backend na nuvem, com projeto hospedado na região **São Paulo (América do Sul)**, e:

- **PostgreSQL** como banco de dados relacional (modelo em `docs/diagrams/modelo-er.md`);
- **Supabase Auth** para cadastro e login;
- **Row Level Security (RLS)** ativado em todas as tabelas, com políticas do tipo `user_id = auth.uid()` nas tabelas de dados pessoais (consultas, lembretes, notificações, perfil) e leitura pública apenas nas tabelas de catálogo (medicamentos, unidades, especialidades, médicos, estoque);
- **Funções com `SECURITY DEFINER`** para casos controlados, como `booked_slots`, que informa horários ocupados sem expor consultas de outros usuários;
- **View com `security_invoker`** (`medications_with_status`) que calcula o status agregado do medicamento a partir do estoque de cada unidade;
- **Edge Functions** (futuras) para lógica de servidor, como a funcionalidade de IA, mantendo chaves de API fora do navegador;
- **Views SQL** como fonte de dados para o dashboard de BI.

O acesso do front-end ao banco ocorre por meio do `SupabaseMedicationRepository` (ver ADR-003), selecionado automaticamente quando as variáveis de ambiente estão preenchidas (ver ADR-007).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Firebase | Banco NoSQL, menos adequado a relações entre consultas, médicos e unidades; consultas para BI são mais difíceis |
| API própria (Node ou Java) com banco hospedado | Muito trabalho para o prazo e mais superfície de ataque a proteger |
| Backend fictício (JSON local) | Não cumpre os requisitos de nuvem e segurança |

## Consequências

**Positivas**
- Banco relacional, autenticação e segurança por linha prontos, com camada gratuita suficiente para o TCC.
- RLS fornece evidência concreta para o capítulo de segurança.
- SQL padrão facilita a integração com ferramentas de BI.
- Região em São Paulo reduz a latência para usuários brasileiros.

**Negativas / riscos**
- Dependência de fornecedor externo (mitigada pelo padrão Repository, ver ADR-003).
- Limites da camada gratuita (por exemplo, projetos inativos podem ser pausados).
- Políticas de RLS mal escritas podem expor dados, por isso foram testadas (ver `docs/security/testes-rls.md`).

## Evidências

- Scripts `db/01_schema.sql`, `db/02_seed.sql` e `db/03_teste_rls.sql`
- Print do Table Editor do Supabase com as 9 tabelas (salvar em `docs/evidence/`)
- Print das políticas de RLS (menu Authentication > Policies)
- Print do aplicativo exibindo os medicamentos vindos do banco
- Resultado do teste de isolamento entre usuários
