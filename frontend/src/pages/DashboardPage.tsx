import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { DashboardData, LEAD_STAGES } from '../types';
import { formatCurrency, stageLabel } from '../utils';
import PageHeader, { KpiCard, Badge, EmptyState } from '../components/UI';

const STAGE_COLORS: Record<'light' | 'dark', Record<string, string>> = {
  light: {
    new: '#64748b',
    contacted: '#2563eb',
    qualified: '#7c3aed',
    proposal_sent: '#d97706',
    won: '#059669',
    lost: '#dc2626',
  },
  dark: {
    new: '#a1a1aa',
    contacted: '#60a5fa',
    qualified: '#a78bfa',
    proposal_sent: '#fbbf24',
    won: '#34d399',
    lost: '#f87171',
  },
};

export default function DashboardPage() {
  const { theme } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">Loading dashboard...</div>;
  if (!data) return <EmptyState message="Failed to load dashboard" />;

  const { kpis, leadsByStage, monthlySales, teamPerformance, recentLeads } = data;

  const stageChartData = LEAD_STAGES.map((s) => {
    const found = leadsByStage.find((l) => l.stage === s.key);
    return { name: s.label, value: found?.count || 0, fill: STAGE_COLORS[theme][s.key] };
  }).filter((d) => d.value > 0);
  const chartTextColor = theme === 'dark' ? '#d1d5db' : '#526176';
  const chartGridColor = theme === 'dark' ? '#45494e' : '#e2e8f0';
  const revenueGradient = theme === 'dark'
    ? ['#2dd4bf', '#0f9f91']
    : ['#0f766e', '#14b8a6'];
  const revenueGradientId = `revenue-gradient-${theme}`;
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#222426' : '#ffffff',
    borderColor: theme === 'dark' ? '#44484c' : '#cbd5e1',
    borderRadius: 10,
    color: theme === 'dark' ? '#f1f2f3' : '#172033',
    boxShadow: theme === 'dark' ? '0 8px 24px rgb(0 0 0 / 0.25)' : '0 8px 24px rgb(15 23 42 / 0.08)',
  };

  return (
    <PageHeader title="Sales Dashboard" subtitle="Overview of your sales performance">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Revenue" value={formatCurrency(kpis.revenue)} icon={DollarSign} color="bg-emerald-100 text-emerald-600" />
        <KpiCard label="Lead Conversion Rate" value={`${kpis.leadConversionRate}%`} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
        <KpiCard label="Active Leads" value={String(kpis.activeLeads)} icon={Target} color="bg-amber-100 text-amber-600" />
        <KpiCard label="Total Customers" value={String(kpis.totalCustomers)} icon={Users} color="bg-indigo-100 text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Monthly Sales</h3>
          <p className="mb-4 text-xs text-slate-500">Revenue over time</p>
          {monthlySales.length === 0 ? (
            <EmptyState message="No sales data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlySales} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id={revenueGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={revenueGradient[0]} />
                    <stop offset="100%" stopColor={revenueGradient[1]} />
                  </linearGradient>
                </defs>
                <CartesianGrid fill="none" strokeDasharray="4 4" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <YAxis tick={{ fontSize: 12, fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip cursor={{ fill: theme === 'dark' ? '#ffffff08' : '#0f172a08' }} formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} labelStyle={{ color: chartTextColor }} />
                <Bar dataKey="revenue" fill={`url(#${revenueGradientId})`} radius={[7, 7, 0, 0]} maxBarSize={72} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Leads by Stage</h3>
          <p className="mb-4 text-xs text-slate-500">Current pipeline distribution</p>
          {stageChartData.length === 0 ? (
            <EmptyState message="No leads yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stageChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke={theme === 'dark' ? '#222426' : '#ffffff'}
                  strokeWidth={2}
                >
                  {stageChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chartTextColor }} itemStyle={{ color: chartTextColor }} />
                <Legend
                  verticalAlign="bottom"
                  height={56}
                  content={({ payload }) => (
                    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-1 text-xs" style={{ color: chartTextColor }}>
                      {payload?.map((entry) => {
                        const stage = stageChartData.find((item) => item.name === entry.value);
                        return (
                          <li key={String(entry.value)} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.value}: {stage?.value ?? 0}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {teamPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Team Performance</h3>
          <p className="mb-4 text-xs text-slate-500">Results by team member</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="pb-3 font-medium">Team Member</th>
                  <th className="pb-3 font-medium">Total Leads</th>
                  <th className="pb-3 font-medium">Won Deals</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                    <td className="py-3 font-medium">{member.name}</td>
                    <td className="py-3">{member.total_leads}</td>
                    <td className="py-3">{member.won_deals}</td>
                    <td className="py-3">{formatCurrency(member.revenue)}</td>
                    <td className="py-3">
                      {member.total_leads > 0 ? `${Math.round((member.won_deals / member.total_leads) * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Recent Leads</h3>
        <p className="mb-4 text-xs text-slate-500">Latest updates in your pipeline</p>
        {recentLeads.length === 0 ? (
          <EmptyState message="No recent leads" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Value</th>
                  <th className="pb-3 font-medium">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => {
                  const stageInfo = LEAD_STAGES.find((s) => s.key === lead.stage);
                  return (
                    <tr key={lead.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="py-3 font-medium">{lead.name}</td>
                      <td className="py-3">{lead.company || '—'}</td>
                      <td className="py-3">
                        <Badge className={stageInfo?.color || ''}>{stageLabel(lead.stage)}</Badge>
                      </td>
                      <td className="py-3">{formatCurrency(lead.value)}</td>
                      <td className="py-3">{lead.assigned_name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageHeader>
  );
}
