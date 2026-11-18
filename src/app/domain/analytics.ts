/** Indicadores AGREGADOS do painel de BI (função bi_dashboard no banco). Sem dados de pacientes. */
export interface DashboardKpis {
  appointments: number;
  cancelled: number;
  upcoming: number;
  users: number;
  usersWithConsent: number;
  newUsers: number;
  activeReminders: number;
  usersWithReminders: number;
}

export interface DashboardData {
  period: { days: number; from: string; to: string };
  kpis: DashboardKpis;
  bySpecialty: { name: string; total: number; cancelled: number }[];
  byUnit: { name: string; total: number }[];
  byWeek: { week: string; total: number; cancelled: number }[];
  byHour: { hour: number; total: number }[];
  byKind: { kind: string; total: number }[];
  stockByUnit: { name: string; disponivel: number; atencao: number; indisponivel: number }[];
  topUnavailable: { name: string; units: number }[];
}

export const DASHBOARD_PERIODS = [7, 30, 90, 365] as const;
