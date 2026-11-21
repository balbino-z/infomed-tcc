import type { AdherenceSummary, TodayDose } from '../domain/adherence';

/** Doses tomadas e adesão do usuário logado. */
export interface AdherenceRepository {
  /** Doses de hoje com o selo de cada uma (tomada, pendente, atrasada, esquecida). */
  todayDoses(): Promise<TodayDose[]>;
  /** Botão "Tomei" (para quem não tem a caixa). Registra com source = app. */
  confirmDose(reminderId: string, scheduledAt: string): Promise<void>;
  /** Adesão dos últimos `days` dias. */
  summary(days: number): Promise<AdherenceSummary>;
}
