# Feature: Lembretes de medicação e notificações

- **Requisito atendido (RF/RNF):** RF - Criar, listar, ativar/desativar e excluir lembretes; ser avisado na hora do remédio; receber notificações das consultas; RNF - Baixo acoplamento entre módulos.
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos (Observer); Programação Multi Plataforma; Segurança e Defesa Cibernética
- **Padrão ou tecnologia usada e por quê:** Observer por meio do `EventBus`, agendador local de lembretes, validações no banco (ADR-012).
- **Arquivos principais:**
  - `db/07_lembretes.sql`
  - `src/app/domain/reminder.ts`, `notification.ts`
  - `repositories/ReminderRepository.ts`, `NotificationRepository.ts` (Mock e Supabase)
  - `src/app/features/notifications/NotificationBus.ts`, `useUnreadCount.ts`
  - `src/app/features/reminders/ReminderScheduler.ts`, `ReminderAlerts.tsx`, `reminders.test.tsx`
  - Telas: `RemindersList`, `CreateReminder`, `Notifications`, e os blocos de lembretes e do sino na `Home` e no `Header`
- **Como testar:**
  1. Lembretes → "+": nome (ou escolha um medicamento da lista), horários, dias e observação; salvar.
  2. Na lista: ligar/desligar e excluir. Na Home: os horários de hoje aparecem, os já passados ficam cinzas.
  3. Para ver o alerta: crie um lembrete para daqui a 2 minutos, mantenha o app aberto. Deve aparecer "Hora do remédio" (com "Adiar 10 min"). Toque em "Ativar avisos no aparelho" para o aviso do sistema.
  4. Agende uma consulta: o sino mostra o contador; em Notificações, tocar em uma a marca como lida e o contador cai; "Marcar todas como lidas" zera.
  5. `npm test`: testes do canal, da regra de horário e das telas.
- **Evidência (print ou diagrama):** prints em `docs/evidence/`; diagramas em `docs/diagrams/padroes-de-projeto.md`.
- **Observações / dificuldades encontradas:** os avisos de lembrete só funcionam com o app aberto (limitação do PWA, registrada no ADR-012); os lembretes não registram "tomado". O banco recusa horários mal formatados, dias inválidos e nomes vazios.
