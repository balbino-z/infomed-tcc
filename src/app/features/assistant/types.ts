import type { AppState, Screen } from '../navigation/types';
import type { HealthUnitRepository } from '../../repositories/HealthUnitRepository';
import type { MedicationRepository } from '../../repositories/MedicationRepository';

/** Botão de ação dentro da resposta (navega para uma tela do app). */
export interface ReplyAction {
  label: string;
  screen: Screen;
  data?: Partial<AppState>;
  /** link de telefone em vez de navegação (ex.: tel:192) */
  href?: string;
}

/** De onde veio a resposta (útil para o TCC e para os testes). */
export type ReplySource = 'alert' | 'intent' | 'faq' | 'fallback';

export interface AssistantReply {
  text: string;
  source: ReplySource;
  tone?: 'normal' | 'alert';
  actions?: ReplyAction[];
  /** sugestões de próximas perguntas */
  suggestions?: string[];
}

/** O que os elos da corrente podem usar (injetado, para testar sem banco). */
export interface AssistantContext {
  medications: MedicationRepository;
  units: HealthUnitRepository;
  now: () => Date;
}

/**
 * PADRÃO CHAIN OF RESPONSIBILITY: cada elo tenta responder;
 * se não souber (null), a mensagem passa para o próximo.
 */
export interface AssistantHandler {
  readonly name: string;
  handle(message: string, ctx: AssistantContext): Promise<AssistantReply | null>;
}
