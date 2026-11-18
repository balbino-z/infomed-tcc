# ADR-012: Padrão Observer para notificações e lembretes de medicação

- **Status:** Aceita (implementada em 20/10/2026)
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos, Programação Multi Plataforma, Segurança e Defesa Cibernética

## Contexto

Várias partes do aplicativo precisam reagir a acontecimentos que ocorrem em outras: o sino do cabeçalho deve mostrar o número de notificações não lidas quando uma consulta é agendada, a lista de notificações deve se atualizar ao marcar como lida, a tela inicial deve refletir novos lembretes e, na hora de tomar um remédio, o usuário deve ser avisado. Ligar cada tela diretamente às demais geraria forte acoplamento.

## Decisão

1. **Padrão Observer** com um canal de eventos tipado (`EventBus`, em `features/notifications/NotificationBus.ts`). Quem tem novidade **publica** (`emit`); quem se interessa **assina** (`on`) e recebe a função para cancelar a assinatura. Eventos: `notifications-changed`, `reminders-changed` e `reminder-due`.
2. Os repositórios (Supabase e Mock) publicam o evento depois de gravar; Header, Home, Notificações e Lembretes assinam e se atualizam sozinhos. O contador também se atualiza ao voltar para o app e a cada minuto.
3. **Lembretes de medicação** são armazenados no banco (`reminders`), com nome livre ou ligado a um medicamento do catálogo, horários, dias da semana e observação. O banco valida o formato dos horários, os dias e o tamanho dos textos.
4. O `ReminderScheduler` confere os lembretes a cada 20 segundos **enquanto o aplicativo está aberto** e publica `reminder-due` no canal; um alerta na tela ("Hora do remédio", com opção de adiar 10 minutos) e, se o usuário permitir, um aviso do sistema (API Notification) reagem ao evento. A função pura `dueReminders` decide o que deve tocar (tolerância de 2 minutos, sem repetição no mesmo dia, respeitando o dia da semana e o fuso de São Paulo).
5. Os avisos de lembrete são **locais ao aparelho**: não são gravados no banco. As notificações de consulta, ao contrário, são criadas pelo servidor (ADR-011).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Estado global (Redux) | Resolve o estado, mas não o aviso entre módulos; mais código para o prazo |
| Supabase Realtime | Exige configuração adicional e conexão permanente; o canal local + atualização periódica atende ao escopo |
| Push em segundo plano (Web Push / Firebase) | Exige servidor de envio e chaves; no iPhone a compatibilidade é limitada. Registrado como trabalho futuro |
| Alarmes no APK com Capacitor | Fora do escopo definido (ADR-009) |

## Consequências

**Positivas**
- Baixo acoplamento: adicionar um novo interessado não exige alterar quem publica.
- Lógica de horário isolada em função pura, coberta por testes com relógio simulado.
- Funcionamento sem backend adicional.

**Negativas / riscos**
- **Limitação importante:** com o aplicativo fechado ou o celular bloqueado, o aviso de lembrete não toca. O TCC deve registrar isso como limitação do PWA e propor push ou Capacitor como trabalho futuro.
- Em alguns navegadores móveis, o aviso do sistema pode exigir service worker; o alerta dentro do app continua funcionando.
- O canal de eventos vale por aba/janela; não sincroniza entre aparelhos (a próxima abertura do app lê o banco).

## Evidências

- `src/app/features/notifications/`, `src/app/features/reminders/`
- Testes: `reminders.test.tsx` (canal, `dueReminders`, agendador com relógio simulado, telas)
- Prints: lembrete criado, alerta "Hora do remédio", contador no sino, notificação marcada como lida
