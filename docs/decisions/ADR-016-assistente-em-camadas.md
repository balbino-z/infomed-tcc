# ADR-016: Assistente (chatbot) em camadas, com custo de tokens zero

- **Status:** Aceita (implementada em 18/11/2026); camada de LLM registrada como trabalho futuro
- **Data:** 18/11/2026
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos (Chain of Responsibility); Inteligência Artificial; Segurança e Defesa Cibernética (LGPD)

## Contexto

O dono do projeto pediu um chatbot dentro do tema do app que consumisse **poucos tokens**. A equipe não tem chave de API de modelo de linguagem nem Supabase CLI, e mensagens de usuários de um app de saúde podem conter dados sensíveis. A maioria das perguntas esperadas é previsível: onde tem um remédio, qual posto está aberto, como agendar ou cancelar, qual especialista procurar, dúvidas frequentes.

## Decisão

1. Padrão **Chain of Responsibility** (`src/app/features/assistant/`): cada elo tenta responder; se devolver `null`, a mensagem segue para o próximo. Ordem:
   1. **Alerta** (`alertHandler`): as mesmas regras da triagem (`emergency.ts`). Emergência → ligar 192/193; risco à vida → CVV 188. Nunca oferece agendamento.
   2. **FAQ quase exata** (`strongFaqHandler`): pergunta praticamente igual a uma da FAQ.
   3. **Intenções** (`intentHandler`): respostas com **ações dentro do app**, usando os repositórios: remédio → quantos postos têm (`unitIdsWithMedication`) e botão para a lista já filtrada; "aberto agora" → `isOpenNow` no fuso de São Paulo; agendar; cancelar; lembretes; sintomas → `analyzeSymptoms` (triagem, ADR-014).
   4. **FAQ aproximada** (`faqHandler`): `faq.json` versionado, busca por sobreposição de termos com o mesmo pré-processamento da triagem.
   5. **Não entendeu** (`fallbackHandler`): sugere perguntas que o assistente sabe responder.
2. Tudo roda **no aparelho**: custo zero, funciona offline para FAQ e alertas, e o texto digitado **não é enviado nem gravado** (histórico só em memória; teste automatizado confere que nada vai para o `localStorage`).
3. Um elo que falhar (ex.: sem internet ao consultar o banco) não derruba o assistente: a corrente segue.
4. Interface: tela `/assistente` e botão flutuante nas telas principais; sugestões em "chips"; aviso fixo "não substitui um profissional de saúde"; nenhuma resposta dá diagnóstico, dose ou conduta.

## Camada de LLM (não implementada; trabalho futuro)

Se houver chave no futuro, entra **um elo a mais antes do "não entendeu"**, sem mudar os outros:
- Supabase Edge Function com a chave **somente no servidor** (nunca no front);
- `max_tokens` baixo (~250), prompt de sistema curto e fixo, histórico limitado às 2-3 últimas trocas;
- chamado só para o que as camadas locais não resolveram, com cache de respostas repetidas;
- limite de mensagens por usuário por dia (tabela de uso com RLS);
- o mesmo aviso e a mesma proibição de diagnóstico/dose.

Foi deixado fora porque exige chave paga, Supabase CLI e envio do texto a um terceiro (dado de saúde), o que pediria consentimento específico.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| LLM respondendo tudo | Custo por mensagem, latência, risco de "alucinar" conduta médica e envio de dados a terceiro |
| Strategy por intenção | Resolve a escolha da resposta, mas não o "repassar quando não sabe"; a corrente expressa melhor as camadas |
| Serviço de chatbot pronto (Dialogflow etc.) | Conta externa, dados fora do app, dependência difícil de testar no CI |
| Um `if` gigante na tela | Impossível de testar por partes e de estender |

## Consequências

**Positivas**
- Zero tokens; respostas instantâneas e previsíveis; segurança (alerta) sempre antes de tudo.
- Cada elo é testado isoladamente e a corrente inteira também (26 testes).
- Novo assunto = nova entrada no `faq.json` ou nova intenção, sem tocar na tela.

**Negativas / riscos**
- Entende só o que foi previsto; perguntas fora do tema caem no "não entendeu".
- Intenções por expressão regular podem confundir frases ambíguas; a ordem dos elos foi calibrada por testes com frases de exemplo.

## Evidências

- `src/app/features/assistant/` (`types.ts`, `handlers.ts`, `assistant.ts`, `faq.json`, `assistant.test.tsx`)
- `src/app/components/screens/Assistant.tsx`, `components/shared/AssistantFab.tsx`
- Prints: conversa com remédio e botão para os postos, resposta de emergência, FAQ
