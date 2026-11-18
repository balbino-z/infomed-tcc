import type { DashboardData } from '../domain/analytics';

export interface AnalyticsRepository {
  /** Indicadores agregados dos últimos `days` dias. Só administrador (o banco recusa os demais). */
  getDashboard(days: number): Promise<DashboardData>;
}

export class AnalyticsAccessError extends Error {}
