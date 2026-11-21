import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdherenceDashboard, DashboardData } from '../../domain/analytics';
import { AnalyticsAccessError, type AnalyticsRepository } from '../AnalyticsRepository';

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getDashboard(days: number): Promise<DashboardData> {
    // bi_dashboard (db/08_bi.sql) confere no servidor se o usuário é administrador
    const { data, error } = await this.db.rpc('bi_dashboard', { p_days: days });
    if (error) {
      if (error.code === '42501' || /restrito/i.test(error.message)) throw new AnalyticsAccessError('Acesso restrito ao administrador.');
      throw new Error('Não foi possível carregar o painel.');
    }
    return data as DashboardData;
  }

  async getAdherence(days: number): Promise<AdherenceDashboard> {
    // bi_adesao (db/10_caixa.sql): só administrador e só números agregados
    const { data, error } = await this.db.rpc('bi_adesao', { p_days: days });
    if (error) {
      if (error.code === '42501' || /restrito/i.test(error.message)) throw new AnalyticsAccessError('Acesso restrito ao administrador.');
      throw new Error('Não foi possível carregar a adesão.');
    }
    return data as AdherenceDashboard;
  }
}
