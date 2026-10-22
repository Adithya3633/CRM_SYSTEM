import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, RotateCcw, Search, Trash2 } from 'lucide-react';
import { api } from '../api';
import { Lead, LeadStage, LEAD_STAGES, User } from '../types';
import { formatCurrency, stageLabel } from '../utils';
import PageHeader, { Btn, Modal, FormField, TextInput, TextArea, SelectInput, SearchInput, Badge, EmptyState } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', phone: '', company: '', stage: 'new' as LeadStage, value: '', source: '', notes: '', assigned_to: '' };

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadLeads = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (stageFilter) params.stage = stageFilter;
    if (assigneeFilter) params.assigned_to = assigneeFilter;
    api.getLeads(params).then(setLeads).finally(() => setLoading(false));
  }, [search, stageFilter, assigneeFilter]);

  useEffect(() => {
    loadLeads();
    if (user?.role !== 'sales_executive') {
      api.getUsers().then(setUsers);
    }
  }, [loadLeads, user]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      stage: lead.stage,
      value: String(lead.value),
      source: lead.source || '',
      notes: lead.notes || '',
      assigned_to: String(lead.assigned_to),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      company: form.company || undefined,
      stage: form.stage,
      value: Number(form.value) || 0,
      source: form.source || undefined,
      notes: form.notes || undefined,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
    };
    if (editing) {
      await api.updateLead(editing.id, payload);
    } else {
      await api.createLead(payload);
    }
    setModalOpen(false);
    loadLeads();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this lead?')) return;
    await api.deleteLead(id);
    loadLeads();
  };

  const handleStageChange = async (leadId: number, stage: LeadStage) => {
    await api.updateLeadStage(leadId, stage);
    loadLeads();
  };

  const executives = users.filter((u) => u.role === 'sales_executive' || u.role === 'sales_manager');
  const hasFilters = Boolean(search.trim() || stageFilter || assigneeFilter);
  const visibleStages = LEAD_STAGES.filter((stage) => {
    if (!hasFilters) return true;
    return leads.some((lead) => lead.stage === stage.key);
  });
  const clearFilters = () => {
    setSearch('');
    setStageFilter('');
    setAssigneeFilter('');
  };

  return (
    <PageHeader
      title="Lead Management"
      subtitle="Track leads through the sales pipeline"
      action={
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setView(view === 'pipeline' ? 'table' : 'pipeline')}>
            {view === 'pipeline' ? 'Table View' : 'Pipeline View'}
          </Btn>
          <Btn onClick={openCreate}><Plus size={16} className="inline mr-1" />Add Lead</Btn>
        </div>
      }
    >
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, company, email..." className="pl-10" />
          </div>
          <SelectInput
            value={stageFilter}
            onChange={setStageFilter}
            placeholder="All Stages"
            options={LEAD_STAGES.map((s) => ({ value: s.key, label: s.label }))}
          />
          {user?.role !== 'sales_executive' && (
            <SelectInput
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              placeholder="All Assignees"
              options={executives.map((u) => ({ value: String(u.id), label: u.name }))}
            />
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              title="Clear filters"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
            >
              <RotateCcw size={15} />
              Clear
            </button>
          )}
        </div>
        {hasFilters && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'} match your filters
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400">Loading leads...</div>
      ) : view === 'pipeline' ? (
        visibleStages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search size={21} />
            </div>
            <h3 className="font-semibold text-slate-800">No leads found</h3>
            <p className="mt-1 text-sm text-slate-500">Try a different search or clear the filters.</p>
            <button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-700">Clear filters</button>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {visibleStages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.key);
            return (
              <div key={stage.key} className="group min-h-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100/80 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Pipeline stage</p>
                    <h3 className="mt-0.5 text-sm font-bold text-slate-800">{stage.label}</h3>
                  </div>
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-bold text-white">{stageLeads.length}</span>
                </div>
                <div className="space-y-3 p-3">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="relative rounded-lg border border-slate-200 border-l-4 border-l-brand-500 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{lead.name}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{lead.company || 'No company added'}</p>
                        </div>
                        <span className="shrink-0 rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{formatCurrency(lead.value)}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(lead)} title="Edit lead" className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(lead.id)} title="Delete lead" className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                        {stage.key !== 'won' && stage.key !== 'lost' && (
                          <select
                            aria-label={`Move ${lead.name}`}
                            className="max-w-[115px] rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-600 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                            value=""
                            onChange={(e) => e.target.value && handleStageChange(lead.id, e.target.value as LeadStage)}
                          >
                            <option value="">Move</option>
                            {LEAD_STAGES.filter((s) => s.key !== stage.key).map((s) => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && !hasFilters && <p className="py-10 text-center text-xs text-slate-400">No leads here yet</p>}
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : leads.length === 0 ? (
        <EmptyState message="No leads found" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const stageInfo = LEAD_STAGES.find((s) => s.key === lead.stage);
                return (
                  <tr key={lead.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3">{lead.company || '—'}</td>
                    <td className="px-4 py-3"><Badge className={stageInfo?.color || ''}>{stageLabel(lead.stage)}</Badge></td>
                    <td className="px-4 py-3">{formatCurrency(lead.value)}</td>
                    <td className="px-4 py-3">{lead.source || '—'}</td>
                    <td className="px-4 py-3">{lead.assigned_name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(lead)} className="p-1 text-slate-400 hover:text-brand-600"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(lead.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lead' : 'Add Lead'}>
        <form onSubmit={handleSave}>
          <FormField label="Name *"><TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} required /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email"><TextInput value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" /></FormField>
            <FormField label="Phone"><TextInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} /></FormField>
          </div>
          <FormField label="Company"><TextInput value={form.company} onChange={(v) => setForm({ ...form, company: v })} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stage">
              <SelectInput value={form.stage} onChange={(v) => setForm({ ...form, stage: v as LeadStage })} options={LEAD_STAGES.map((s) => ({ value: s.key, label: s.label }))} />
            </FormField>
            <FormField label="Value ($)"><TextInput value={form.value} onChange={(v) => setForm({ ...form, value: v })} type="number" /></FormField>
          </div>
          <FormField label="Source"><TextInput value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="Website, Referral, etc." /></FormField>
          {user?.role !== 'sales_executive' && executives.length > 0 && (
            <FormField label="Assigned To">
              <SelectInput value={form.assigned_to} onChange={(v) => setForm({ ...form, assigned_to: v })} placeholder="Select assignee" options={executives.map((u) => ({ value: String(u.id), label: u.name }))} />
            </FormField>
          )}
          <FormField label="Notes"><TextArea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></FormField>
          <div className="flex gap-2 mt-4">
            <Btn type="submit">{editing ? 'Update' : 'Create'}</Btn>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </PageHeader>
  );
}
