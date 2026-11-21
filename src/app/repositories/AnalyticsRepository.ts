import type { AdherenceDashboard, DashboardData } from '../domain/analytics';

export interface AnalyticsRepository {
  /** Indicadores agregados dos últimos `days` dias. Só administrador (o banco recusa os demais). */
  getDashboard(days: number): Promise<DashboardData>;
  /** Adesão ao tratamento agregada (caixa de remédios + botão "Tomei"). Só administrador. */
  getAdherence(days: number): Promise<AdherenceDashboard>;
}

export class AnalyticsAccessError extends Error {}
