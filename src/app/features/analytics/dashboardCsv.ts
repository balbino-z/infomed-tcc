import type { DashboardData } from '../../domain/analytics';

const KPI_LABELS: Record<keyof DashboardData['kpis'], string> = {
  appointments: 'Consultas marcadas no período',
  cancelled: 'Consultas canceladas no período',
  upcoming: 'Consultas futuras ativas',
  users: 'Usuários cadastrados',
  usersWithConsent: 'Usuários com aceite LGPD',
  newUsers: 'Novos usuários no período',
  activeReminders: 'Lembretes ativos',
  usersWithReminders: 'Usuários com lembretes ativos',
};

export const kpiLabel = (k: keyof DashboardData['kpis']) => KPI_LABELS[k];

/** Escapa um valor para CSV com separador ";" (padrão do Excel em português). */
function cell(v: string | number): string {
  const s = String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV com todas as tabelas do painel, uma seção depois da outra.
 * Começa com BOM para o Excel abrir os acentos corretamente.
 */
export function dashboardToCsv(d: DashboardData): string {
  const rows: (string | number)[][] = [
    ['InfoMed - indicadores agregados (estoque simulado)'],
    ['Período (dias)', d.period.days],
    [],
    ['Indicador', 'Valor'],
    ...(Object.keys(KPI_LABELS) as (keyof DashboardData['kpis'])[]).map((k) => [KPI_LABELS[k], d.kpis[k]]),
    [],
    ['Especialidade', 'Consultas', 'Canceladas'],
    ...d.bySpecialty.map((r) => [r.name, r.total, r.cancelled]),
    [],
    ['Unidade', 'Consultas'],
    ...d.byUnit.map((r) => [r.name, r.total]),
    [],
    ['Semana (início)', 'Consultas', 'Canceladas'],
    ...d.byWeek.map((r) => [r.week, r.total, r.cancelled]),
    [],
    ['Hora', 'Consultas'],
    ...d.byHour.map((r) => [`${String(r.hour).padStart(2, '0')}h`, r.total]),
    [],
    ['Tipo', 'Consultas'],
    ...d.byKind.map((r) => [r.kind, r.total]),
    [],
    ['Unidade', 'Disponível', 'Atenção', 'Indisponível'],
    ...d.stockByUnit.map((r) => [r.name, r.disponivel, r.atencao, r.indisponivel]),
    [],
    ['Medicamento mais indisponível', 'Unidades sem estoque'],
    ...d.topUnavailable.map((r) => [r.name, r.units]),
  ];
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}
