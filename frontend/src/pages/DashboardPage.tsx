import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api';
import { DashboardData, LEAD_STAGES } from '../types';
import { formatCurrency, stageLabel } from '../utils';
import PageHeader, { KpiCard, Badge, EmptyState } from '../components/UI';

const STAGE_COLORS: Record<string, string> = {
  new: '#94a3b8',
  contacted: '#3b82f6',
  qualified: '#6366f1',
  proposal_sent: '#f59e0b',
  won: '#10b981',
  lost: '#ef4444',
};

export default function DashboardPage() {
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
    return { name: s.label, value: found?.count || 0, fill: STAGE_COLORS[s.key] };
  }).filter((d) => d.value > 0);

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
          <h3 className="font-semibold mb-4">Monthly Sales</h3>
          {monthlySales.length === 0 ? (
            <EmptyState message="No sales data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Leads by Stage</h3>
          {stageChartData.length === 0 ? (
            <EmptyState message="No leads yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stageChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {stageChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {teamPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8">
          <h3 className="font-semibold mb-4">Team Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">Team Member</th>
                  <th className="pb-3 font-medium">Total Leads</th>
                  <th className="pb-3 font-medium">Won Deals</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100">
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
        <h3 className="font-semibold mb-4">Recent Leads</h3>
        {recentLeads.length === 0 ? (
          <EmptyState message="No recent leads" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
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
                    <tr key={lead.id} className="border-b border-slate-100">
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
