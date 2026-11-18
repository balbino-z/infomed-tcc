# ADR-011: Agendamento com regras de negócio no banco e padrão Factory

- **Status:** Aceita (implementada em 20/10/2026)
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos, Segurança e Defesa Cibernética, Computação em Nuvem

## Contexto

O agendamento é a funcionalidade central do InfoMed. Ele precisa impedir duas marcações no mesmo horário, respeitar o expediente das unidades e permitir que cada pessoa veja e cancele apenas as próprias consultas. Regras que existem só no aplicativo podem ser burladas por quem chamar a API diretamente, e dados de saúde exigem rigor.

## Decisão

1. **Padrão Factory no aplicativo.** A classe `AppointmentFactory` centraliza a criação do pedido de agendamento (`AppointmentDraft`). Cada tipo (consulta, retorno, exame) tem regras próprias de antecedência mínima e prazo máximo; a fábrica valida e devolve um pedido pronto ou uma mensagem de erro. A tela não conhece essas regras.
2. **Regras repetidas no banco (defesa em profundidade).** O gatilho `validate_appointment` rejeita, no servidor: horário passado ou além de 60 dias; fim de semana; horário fora do expediente da unidade; horários que não sejam de 30 em 30 minutos; mais de 5 consultas ativas por pessoa; e qualquer alteração que não seja o cancelamento de uma consulta futura (não é possível mudar médico, horário, tipo, dono, nem marcar como "concluída").
3. **Concorrência.** Índices únicos parciais impedem dois agendamentos ativos para o mesmo médico e horário e dois para a mesma pessoa no mesmo horário. Se duas pessoas tentarem o mesmo horário simultaneamente, o banco aceita uma e recusa a outra, e o aplicativo mostra "Esse horário acabou de ser ocupado".
4. **Privacidade dos horários.** A tela consulta os horários ocupados pela função `booked_slots`, que devolve somente os instantes, sem revelar quem marcou. As consultas de cada pessoa vêm da view `my_appointments` (`security_invoker`), protegida pelo RLS.
5. **Notificações geradas pelo servidor.** O gatilho `notify_appointment` (com `SECURITY DEFINER`) cria a notificação "Consulta agendada" ou "Consulta cancelada". O cliente não tem permissão para inserir notificações, o que impede falsificá-las.
6. **Fuso horário.** Datas e horários são calculados e exibidos no fuso de São Paulo, independentemente do fuso do aparelho.
7. **Limitação assumida:** o app não registra comparecimento; uma consulta ativa cujo horário já passou é exibida como "Realizada".

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Validar apenas no aplicativo | Pode ser burlado; não evita duplicidade em concorrência |
| API própria para o agendamento | Complexidade e superfície de ataque desnecessárias para o prazo |
| Reservar com "bloqueio" temporário do horário | Exigiria expiração e tarefas agendadas; o índice único resolve o caso com menos código |

## Consequências

**Positivas**
- Regras garantidas mesmo fora do aplicativo; evidência concreta para o capítulo de segurança (14 casos testados).
- A fábrica concentra as regras por tipo e é fácil de testar e de estender (novo tipo = nova entrada).
- Mensagens de erro claras ao usuário, traduzidas do banco.

**Negativas / riscos**
- Regras duplicadas (app e banco) precisam ser mantidas juntas; o banco é a fonte final.
- Os médicos e o estoque são simulados (ver `docs/data/fontes-unidades.md`); a agenda de cada médico é considerada integralmente livre no expediente da unidade.
- Sem pagamento, fila de espera ou confirmação pela unidade (fora do escopo).

## Evidências

- `db/06_agendamento.sql` e os 14 casos executados (ver `docs/security/testes-rls.md`, T9 a T22)
- `src/app/features/scheduling/` (fábrica, horários, testes) e `SupabaseAppointmentRepository.ts`
- Prints do fluxo completo, da tela com horários ocupados desabilitados e do erro de horário duplicado
