import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { api } from '../api';
import { Customer, User } from '../types';
import PageHeader, { Btn, Modal, FormField, TextInput, SelectInput, SearchInput, Badge, EmptyState } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', phone: '', company: '', address: '', status: 'active', assigned_to: '' };

export default function CustomersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadCustomers = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.getCustomers(params).then(setCustomers).finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    loadCustomers();
    if (user?.role !== 'sales_executive') {
      api.getUsers().then(setUsers);
    }
  }, [loadCustomers, user]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
      status: customer.status,
      assigned_to: String(customer.assigned_to),
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
      address: form.address || undefined,
      status: form.status,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
    };
    if (editing) {
      await api.updateCustomer(editing.id, payload);
    } else {
      await api.createCustomer(payload);
    }
    setModalOpen(false);
    loadCustomers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer?')) return;
    await api.deleteCustomer(id);
    loadCustomers();
  };

  const executives = users.filter((u) => u.role === 'sales_executive' || u.role === 'sales_manager');

  return (
    <PageHeader
      title="Customer Management"
      subtitle="Manage customer details, contacts, and history"
      action={<Btn onClick={openCreate}><Plus size={16} className="inline mr-1" />Add Customer</Btn>}
    >
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." />
        <SelectInput
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Statuses"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {loading ? (
        <div className="text-slate-400">Loading customers...</div>
      ) : customers.length === 0 ? (
        <EmptyState message="No customers found" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.company || '—'}</td>
                  <td className="px-4 py-3">{c.email || '—'}</td>
                  <td className="px-4 py-3">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{c.assigned_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1 text-slate-400 hover:text-brand-600"><Eye size={16} /></button>
                      <button onClick={() => openEdit(c)} className="p-1 text-slate-400 hover:text-brand-600"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSave}>
          <FormField label="Name *"><TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} required /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email"><TextInput value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" /></FormField>
            <FormField label="Phone"><TextInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} /></FormField>
          </div>
          <FormField label="Company"><TextInput value={form.company} onChange={(v) => setForm({ ...form, company: v })} /></FormField>
          <FormField label="Address"><TextInput value={form.address} onChange={(v) => setForm({ ...form, address: v })} /></FormField>
          <FormField label="Status">
            <SelectInput value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </FormField>
          {user?.role !== 'sales_executive' && executives.length > 0 && (
            <FormField label="Assigned To">
              <SelectInput value={form.assigned_to} onChange={(v) => setForm({ ...form, assigned_to: v })} placeholder="Select assignee" options={executives.map((u) => ({ value: String(u.id), label: u.name }))} />
            </FormField>
          )}
          <div className="flex gap-2 mt-4">
            <Btn type="submit">{editing ? 'Update' : 'Create'}</Btn>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </PageHeader>
  );
}
