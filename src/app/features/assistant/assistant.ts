import type { AssistantContext, AssistantHandler, AssistantReply } from './types';
import { alertHandler, faqHandler, fallbackHandler, intentHandler, strongFaqHandler } from './handlers';

/** Ordem da corrente: alerta -> FAQ quase exata -> intenções -> FAQ aproximada -> não entendeu. */
export const DEFAULT_CHAIN: AssistantHandler[] = [alertHandler, strongFaqHandler, intentHandler, faqHandler, fallbackHandler];

export const MAX_MESSAGE_LENGTH = 300;

/**
 * Passa a mensagem por cada elo até um responder (Chain of Responsibility).
 * Tudo roda no aparelho: nenhum texto é enviado para fora nem gravado.
 * Um elo com modelo de linguagem (LLM) poderia entrar antes do fallback (ver ADR-016).
 */
export async function answer(message: string, ctx: AssistantContext, chain: AssistantHandler[] = DEFAULT_CHAIN): Promise<AssistantReply> {
  const text = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  for (const handler of chain) {
    try {
      const reply = await handler.handle(text, ctx);
      if (reply) return reply;
    } catch {
      // um elo com erro (ex.: sem internet) não derruba o assistente: passa adiante
    }
  }
  return fallbackHandler.handle(text, ctx) as Promise<AssistantReply>;
}
