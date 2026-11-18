# Feature: Assistente (chatbot) em camadas

- **Requisito atendido (RF/RNF):** RF - O usuário tira dúvidas sobre remédios, postos, consultas e lembretes em linguagem natural e é levado à tela certa. RNF - Sem custo por mensagem e sem enviar ou gravar o texto digitado.
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos (Chain of Responsibility); Inteligência Artificial; Segurança e Defesa Cibernética
- **Padrão ou tecnologia usada e por quê:** Chain of Responsibility com 5 elos (alerta, FAQ forte, intenções, FAQ aproximada, não entendeu), tudo no aparelho (ADR-016). LLM registrado como trabalho futuro.
- **Arquivos principais:**
  - `src/app/features/assistant/types.ts`, `handlers.ts`, `assistant.ts`, `faq.json`, `assistant.test.tsx`
  - `src/app/components/screens/Assistant.tsx` (rota `/assistente`), `components/shared/AssistantFab.tsx` (botão flutuante)
- **Como testar:**
  1. Na Home, toque no botão redondo azul (canto inferior direito).
  2. "Onde tem Losartana?" → número de postos e botão "Ver postos com o remédio" (lista já filtrada).
  3. "Qual UBS está aberta agora?" → depende do horário; em fim de semana diz que nenhuma está aberta.
  4. "Estou com dor de dente" → sugere Odontologia e oferece agendar ou abrir a triagem.
  5. "Os lembretes tocam com o app fechado?" e "Preciso de receita?" → respostas da FAQ.
  6. "Estou com dor no peito" → mensagem vermelha e botão para ligar 192, sem agendamento.
  7. Saia da tela e volte: a conversa recomeça (não é guardada).
  8. `npm test`: 26 testes do assistente.
- **Evidência (print ou diagrama):** prints em `docs/evidence/`; diagrama em `docs/diagrams/padroes-de-projeto.md`.
- **Observações / dificuldades encontradas:** a ordem dos elos importa (ex.: "os lembretes tocam com o app fechado?" é FAQ, não a intenção "lembretes"); por isso há uma FAQ "forte" antes das intenções. Perguntas fora do tema caem no "não entendeu".
