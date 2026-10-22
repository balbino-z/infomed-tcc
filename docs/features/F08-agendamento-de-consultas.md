# Feature: Agendamento de consultas, histórico e cancelamento

- **Requisito atendido (RF/RNF):** RF - Agendar consulta, retorno ou exame; ver e cancelar as próprias consultas; RNF - Consistência (sem horário duplicado), segurança e privacidade.
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos (Factory, Repository); Segurança e Defesa Cibernética; Computação em Nuvem
- **Padrão ou tecnologia usada e por quê:** Factory para criar o pedido, Repository para o acesso a dados, regras no banco por gatilhos, índices únicos e RLS (ADR-011).
- **Arquivos principais:**
  - `db/06_agendamento.sql`
  - `src/app/domain/appointment.ts`, `repositories/AppointmentRepository.ts`, `mock/MockAppointmentRepository.ts`, `supabase/SupabaseAppointmentRepository.ts`
  - `src/app/features/scheduling/AppointmentFactory.ts`, `slots.ts`, `dateUtils.ts`, `scheduling.test.tsx`
  - Telas: `ScheduleSpecialty`, `ScheduleDoctor`, `ScheduleDateTime`, `AppointmentConfirmed`, `History`, `CancelAppointment`, e o cartão "Próximas Consultas" da `Home`
- **Como testar:**
  1. Início → Agendar. Escolha o tipo (Consulta, Retorno ou Exame), a especialidade, o médico, o dia e o horário; confirme.
  2. Conferir: tela de confirmação com médico, data, horário e unidade reais; notificação "Consulta agendada" e contador no sino.
  3. Histórico → Próximas: consulta aparece como Confirmada; a Home mostra a próxima consulta.
  4. Em outra conta, abrir o mesmo médico e dia: o horário aparece riscado (indisponível). A outra conta não vê a consulta da primeira.
  5. Cancelar com motivo: a consulta vai para Anteriores como Cancelada, o horário volta a ficar livre, e chega a notificação de cancelamento.
  6. Tentar duas contas no mesmo horário ao mesmo tempo: só uma consegue.
  7. `npm test` (37 testes) e os casos T9 a T27 de `docs/security/testes-rls.md`.
- **Evidência (print ou diagrama):** `docs/diagrams/padroes-de-projeto.md` e prints em `docs/evidence/`.
- **Observações / dificuldades encontradas:** a janela de dias mostra os próximos 10 dias úteis; recarregar no meio do fluxo volta ao início dele (os dados da escolha ficam em memória). Médicos e agenda são simulados.
