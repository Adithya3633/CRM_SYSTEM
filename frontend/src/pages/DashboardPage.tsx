import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { DashboardData, LEAD_STAGES } from '../types';
import { formatCurrency, stageLabel } from '../utils';
import PageHeader, { KpiCard, Badge, EmptyState } from '../components/UI';

const STAGE_COLORS: Record<'light' | 'dark', Record<string, string>> = {
  light: {
    new: '#94a3b8',
    contacted: '#6689ad',
    qualified: '#8279b2',
    proposal_sent: '#c28e43',
    won: '#4d987b',
    lost: '#c76b6b',
  },
  dark: {
    new: '#858d96',
    contacted: '#829dbb',
    qualified: '#a198c5',
    proposal_sent: '#c9a66b',
    won: '#76b398',
    lost: '#cf8080',
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
  const chartTextColor = theme === 'dark' ? '#c0c4c8' : '#64748b';
  const chartGridColor = theme === 'dark' ? '#3a3d40' : '#e2e8f0';
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
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <YAxis tick={{ fontSize: 12, fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} labelStyle={{ color: chartTextColor }} />
                <Bar dataKey="revenue" fill={theme === 'dark' ? '#78a99f' : '#3b8278'} radius={[6, 6, 0, 0]} />
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
                <Pie data={stageChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value, x, y }) => (
                  <text x={x} y={y} fill={chartTextColor} fontSize={12} textAnchor="middle">{`${name}: ${value}`}</text>
                )}>
                  {stageChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chartTextColor }} itemStyle={{ color: chartTextColor }} />
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
