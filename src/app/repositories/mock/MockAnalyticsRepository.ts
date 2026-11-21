import type { AdherenceDashboard, DashboardData } from '../../domain/analytics';
import { AnalyticsAccessError, type AnalyticsRepository } from '../AnalyticsRepository';
import { MockProfileRepository } from './MockProfileRepository';

// Números FICTÍCIOS e fixos (determinísticos), só para ver o painel sem banco.
const profiles = new MockProfileRepository();

export class MockAnalyticsRepository implements AnalyticsRepository {
  async getDashboard(days: number): Promise<DashboardData> {
    if (!(await profiles.getMine()).isAdmin) throw new AnalyticsAccessError('Acesso restrito ao administrador.');
    if (days < 1 || days > 365) throw new Error('Período deve ser de 1 a 365 dias');
    const f = Math.min(days, 90) / 90; // escala os números pelo período
    const n = (x: number) => Math.round(x * f);
    const to = new Date('2026-11-18T12:00:00-03:00');
    const from = new Date(to.getTime() - days * 86_400_000);
    const weeks = Math.max(1, Math.min(13, Math.ceil(days / 7)));
    return {
      period: { days, from: from.toISOString(), to: to.toISOString() },
      kpis: { appointments: n(419), cancelled: n(58), upcoming: 84, users: 40, usersWithConsent: 36, newUsers: n(40), activeReminders: 16, usersWithReminders: 16 },
      bySpecialty: [
        { name: 'Clínico Geral', total: n(113), cancelled: n(15) },
        { name: 'Pediatria', total: n(113), cancelled: n(16) },
        { name: 'Ginecologia', total: n(102), cancelled: n(10) },
        { name: 'Odontologia', total: n(91), cancelled: n(17) },
      ],
      byUnit: [
        { name: 'UBS Exemplo Centro', total: n(240) },
        { name: 'UBS Exemplo Norte', total: n(179) },
      ],
      byWeek: Array.from({ length: weeks }, (_, i) => {
        const d = new Date(to.getTime() - (weeks - 1 - i) * 7 * 86_400_000);
        return { week: d.toISOString().slice(0, 10), total: 24 + ((i * 7) % 13), cancelled: 2 + (i % 4) };
      }),
      byHour: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((hour, i) => ({ hour, total: n([73, 68, 73, 52, 49, 13, 17, 28, 22, 15][i]) })),
      byKind: [
        { kind: 'consulta', total: n(293) },
        { kind: 'retorno', total: n(84) },
        { kind: 'exame', total: n(42) },
      ],
      stockByUnit: [
        { name: 'UBS Exemplo Centro', disponivel: 4, atencao: 1, indisponivel: 1 },
        { name: 'UBS Exemplo Norte', disponivel: 3, atencao: 2, indisponivel: 1 },
      ],
      topUnavailable: [
        { name: 'Amoxicilina 500mg', units: 2 },
        { name: 'Sinvastatina 20mg', units: 1 },
      ],
    };
  }

  async getAdherence(days: number): Promise<AdherenceDashboard> {
    if (!(await profiles.getMine()).isAdmin) throw new AnalyticsAccessError('Acesso restrito ao administrador.');
    if (days < 1 || days > 365) throw new Error('Período deve ser de 1 a 365 dias');
    const weeks = Math.max(1, Math.min(13, Math.ceil(days / 7)));
    const to = new Date('2026-11-18T12:00:00-03:00');
    return {
      days,
      minGroup: 5,
      patients: 16,
      expected: 900,
      taken: 702,
      rate: 78,
      byPeriod: [
        { period: 'manha', patients: 14, rate: 86 },
        { period: 'tarde', patients: 6, rate: 77 },
        { period: 'noite', patients: 12, rate: 69 },
      ],
      byWeek: Array.from({ length: weeks }, (_, i) => ({
        week: new Date(to.getTime() - (weeks - 1 - i) * 7 * 86_400_000).toISOString().slice(0, 10),
        patients: 16,
        rate: 72 + ((i * 5) % 12),
      })),
      devices: { active: 3, online: 2, tempAlerts: 1 },
    };
  }
}
