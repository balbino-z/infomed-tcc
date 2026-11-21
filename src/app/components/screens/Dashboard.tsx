import { useEffect, useState, type ReactNode } from 'react';
import { Download, Lock } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Screen, AppState } from '../../App';
import { DASHBOARD_PERIODS, type AdherenceDashboard, type DashboardData } from '../../domain/analytics';
import { PERIOD_LABEL } from '../../domain/adherence';
import { analyticsRepository } from '../../repositories';
import { AnalyticsAccessError } from '../../repositories/AnalyticsRepository';
import { dashboardToCsv, kpiLabel } from '../../features/analytics/dashboardCsv';
import { formatDateBR } from '../../features/profile/profileUtils';
import { Header } from '../shared/Header';

interface DashboardProps {
  navigate: (screen: Screen, data?: Partial<AppState>) => void;
}

// Cores validadas (contraste e daltonismo) com o validador da skill de visualização
const BLUE = '#0A73FF';
const ORANGE = '#E8590C';
const STATUS = { disponivel: '#1E9E6A', atencao: '#D9A400', indisponivel: '#E5484D' };
const AXIS = { fontSize: 11, fill: '#64748B' };
const GRID = '#E8F1FF';
// texto da legenda na cor do texto (a cor da série fica só no marcador)
const legendText = (value: string) => <span style={{ color: '#1A2B48' }}>{value}</span>;

export default function Dashboard({ navigate }: DashboardProps) {
  const [days, setDays] = useState<number>(90);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let active = true;
    setError('');
    analyticsRepository
      .getDashboard(days)
      .then((d) => active && setData(d))
      .catch((e: unknown) => {
        if (!active) return;
        if (e instanceof AnalyticsAccessError) setDenied(true);
        else setError(e instanceof Error ? e.message : 'Não foi possível carregar o painel.');
      });
    return () => { active = false; };
  }, [days]);

  // Adesão vem de outra função (db/10). Se ela ainda não existir no banco, o resto do painel continua.
  const [adherence, setAdherence] = useState<AdherenceDashboard | null>(null);
  const [adherenceError, setAdherenceError] = useState('');
  useEffect(() => {
    let active = true;
    setAdherenceError('');
    analyticsRepository
      .getAdherence(days)
      .then((a) => active && setAdherence(a))
      .catch(() => active && setAdherenceError('Adesão indisponível (rode o db/10_caixa.sql no Supabase).'));
    return () => { active = false; };
  }, [days]);

  const exportCsv = () => {
    if (!data) return;
    const blob = new Blob([dashboardToCsv(data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infomed-indicadores-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (denied) {
    return (
      <div className="h-full bg-[#F7FAFF] flex flex-col">
        <Header title="Painel de BI" onBack={() => navigate('profile')} showNotification={false} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <Lock className="w-10 h-10 text-[#CED6E0] mb-3" />
          <p role="alert" className="text-[#1A2B48]">Acesso restrito ao administrador.</p>
        </div>
      </div>
    );
  }

  const weekly = data?.byWeek.map((w) => ({ ...w, label: formatDateBR(w.week).slice(0, 5) })) ?? [];
  const hourly = data?.byHour.map((h) => ({ ...h, label: `${h.hour}h` })) ?? [];

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Painel de BI" onBack={() => navigate('profile')} showNotification={false} />

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-10">
        <p className="text-[#64748B] text-xs mb-3">
          Indicadores agregados, sem identificar pessoas. Estoque simulado. Se houver dados de demonstração carregados, eles entram nas contagens.
        </p>

        {/* filtros em uma linha acima dos gráficos */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex flex-1 gap-1 bg-white rounded-xl p-1 border border-[#E8F1FF]" role="radiogroup" aria-label="Período">
            {DASHBOARD_PERIODS.map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={days === p}
                onClick={() => setDays(p)}
                className={`flex-1 h-8 rounded-lg text-xs ${days === p ? 'bg-[#0A73FF] text-white' : 'text-[#64748B]'}`}
              >
                {p === 365 ? '1 ano' : `${p} dias`}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={!data} aria-label="Exportar CSV" className="h-10 px-3 rounded-xl bg-white border border-[#E8F1FF] text-[#0A73FF] flex items-center gap-1 text-xs disabled:opacity-50">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        {error && <p role="alert" className="text-[#FF4D5E] text-sm mb-4">{error}</p>}
        {!data && !error && <p className="text-[#64748B]">Carregando...</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Kpi label={kpiLabel('appointments')} value={data.kpis.appointments} />
              <Kpi
                label="Taxa de cancelamento"
                value={data.kpis.appointments ? `${Math.round((data.kpis.cancelled / data.kpis.appointments) * 100)}%` : '—'}
                hint={`${data.kpis.cancelled} canceladas`}
              />
              <Kpi label={kpiLabel('upcoming')} value={data.kpis.upcoming} />
              <Kpi label={kpiLabel('users')} value={data.kpis.users} hint={`${data.kpis.usersWithConsent} com aceite LGPD`} />
              <Kpi label={kpiLabel('newUsers')} value={data.kpis.newUsers} />
              <Kpi label={kpiLabel('activeReminders')} value={data.kpis.activeReminders} hint={`${data.kpis.usersWithReminders} usuários`} />
            </div>

            <Card title="Adesão ao tratamento (caixa de remédios + botão Tomei)">
              {adherenceError && <p className="text-sm text-[#64748B]">{adherenceError}</p>}
              {!adherence && !adherenceError && <p className="text-sm text-[#64748B]">Carregando...</p>}
              {adherence && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Kpi
                      label="Adesão geral"
                      value={adherence.rate === null ? 'oculto' : `${adherence.rate}%`}
                      hint={adherence.rate === null ? `menos de ${adherence.minGroup} pacientes` : `${adherence.taken} de ${adherence.expected} doses`}
                    />
                    <Kpi label="Caixas ativas" value={adherence.devices.active} hint={`${adherence.devices.online} online · ${adherence.devices.tempAlerts} com alerta de temperatura`} />
                  </div>
                  <p className="text-xs text-[#64748B] mb-2">Adesão por período: qual horário se esquece mais</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart
                      data={adherence.byPeriod.map((p) => ({ name: PERIOD_LABEL[p.period], rate: p.rate ?? 0, hidden: p.rate === null }))}
                      layout="vertical"
                      margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={56} />
                      <Tooltip cursor={{ fill: '#F7FAFF' }} formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="rate" name="Adesão" fill={BLUE} radius={[0, 4, 4, 0]} barSize={16}
                        label={{ position: 'right', fontSize: 11, fill: '#1A2B48', formatter: (v: number) => `${v}%` }} />
                    </BarChart>
                  </ResponsiveContainer>
                  {adherence.byPeriod.some((p) => p.rate === null) && (
                    <p className="text-[11px] text-[#64748B]">Períodos com menos de {adherence.minGroup} pacientes aparecem zerados para ninguém ser identificado (LGPD).</p>
                  )}
                </>
              )}
            </Card>

            <Card title="Consultas marcadas por semana">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={legendText} />
                  <Line type="monotone" dataKey="total" name="Marcadas" stroke={BLUE} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="cancelled" name="Canceladas" stroke={ORANGE} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Consultas por especialidade">
              <ResponsiveContainer width="100%" height={Math.max(120, data.bySpecialty.length * 40)}>
                <BarChart data={data.bySpecialty} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={96} />
                  <Tooltip cursor={{ fill: '#F7FAFF' }} />
                  <Bar dataKey="total" name="Consultas" fill={BLUE} radius={[0, 4, 4, 0]} barSize={16} label={{ position: 'right', fontSize: 11, fill: '#1A2B48' }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Horário das consultas">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#F7FAFF' }} />
                  <Bar dataKey="total" name="Consultas" fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Consultas por unidade">
              <ul className="space-y-2">
                {data.byUnit.slice(0, 8).map((u) => (
                  <li key={u.name} className="flex justify-between text-sm">
                    <span className="text-[#1A2B48] truncate pr-3">{u.name}</span>
                    <span className="text-[#64748B]">{u.total}</span>
                  </li>
                ))}
                {data.byUnit.length === 0 && <li className="text-sm text-[#64748B]">Sem consultas no período.</li>}
              </ul>
            </Card>

            <Card title="Estoque por unidade (simulado)">
              <ResponsiveContainer width="100%" height={Math.max(160, data.stockByUnit.length * 30 + 40)}>
                <BarChart data={data.stockByUnit} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...AXIS, fontSize: 10 }} tickLine={false} axisLine={false} width={110} tickFormatter={(v: string) => v.replace(/^UBS /, '')} />
                  <Tooltip cursor={{ fill: '#F7FAFF' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={legendText} />
                  <Bar dataKey="disponivel" name="Disponível" stackId="s" fill={STATUS.disponivel} stroke="#fff" strokeWidth={2} barSize={14} />
                  <Bar dataKey="atencao" name="Atenção" stackId="s" fill={STATUS.atencao} stroke="#fff" strokeWidth={2} />
                  <Bar dataKey="indisponivel" name="Indisponível" stackId="s" fill={STATUS.indisponivel} stroke="#fff" strokeWidth={2} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {data.topUnavailable.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-[#64748B] mb-1">Mais indisponíveis (nº de unidades sem estoque)</p>
                  <ul className="space-y-1">
                    {data.topUnavailable.map((m) => (
                      <li key={m.name} className="flex justify-between text-sm">
                        <span className="text-[#1A2B48]">{m.name}</span>
                        <span className="text-[#64748B]">{m.units}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8F1FF] p-3">
      <p className="text-[#64748B] text-xs mb-1">{label}</p>
      <p className="text-[#1A2B48] text-xl">{value}</p>
      {hint && <p className="text-[#64748B] text-[11px]">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[#E8F1FF] p-4 mb-4">
      <h3 className="text-[#1A2B48] text-sm mb-3">{title}</h3>
      {children}
    </section>
  );
}
