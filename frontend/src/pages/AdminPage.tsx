import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { Organization, User, UserRole, ROLE_LABELS } from '../types';
import PageHeader, { Btn, Modal, FormField, TextInput, SelectInput, Badge, EmptyState } from '../components/UI';

const emptyUserForm = { name: '', email: '', password: '', role: 'sales_executive' as UserRole };

export default function AdminPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orgForm, setOrgForm] = useState({ name: '', industry: '', address: '', phone: '', email: '' });
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [saved, setSaved] = useState(false);

  const load = () => {
    api.getOrganization().then((o) => {
      setOrg(o);
      setOrgForm({ name: o.name, industry: o.industry || '', address: o.address || '', phone: o.phone || '', email: o.email || '' });
    });
    api.getUsers().then(setUsers);
  };

  useEffect(() => { load(); }, []);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateOrganization(orgForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: '', role: user.role });
    setUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const payload: Partial<{ name: string; email: string; role: string; password: string }> = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      if (userForm.password) payload.password = userForm.password;
      await api.updateUser(editingUser.id, payload);
    } else {
      await api.createUser(userForm);
    }
    setUserModal(false);
    load();
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    await api.deleteUser(id);
    load();
  };

  if (!org) return <div className="text-slate-400">Loading...</div>;

  return (
    <PageHeader title="Administration" subtitle="Manage organization and team members">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Organization Settings</h3>
          <form onSubmit={handleSaveOrg}>
            <FormField label="Organization Name"><TextInput value={orgForm.name} onChange={(v) => setOrgForm({ ...orgForm, name: v })} required /></FormField>
            <FormField label="Industry"><TextInput value={orgForm.industry} onChange={(v) => setOrgForm({ ...orgForm, industry: v })} /></FormField>
            <FormField label="Address"><TextInput value={orgForm.address} onChange={(v) => setOrgForm({ ...orgForm, address: v })} /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Phone"><TextInput value={orgForm.phone} onChange={(v) => setOrgForm({ ...orgForm, phone: v })} /></FormField>
              <FormField label="Email"><TextInput value={orgForm.email} onChange={(v) => setOrgForm({ ...orgForm, email: v })} type="email" /></FormField>
            </div>
            <div className="flex items-center gap-3">
              <Btn type="submit">Save Changes</Btn>
              {saved && <span className="text-sm text-emerald-600">Saved!</span>}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Team Members</h3>
            <Btn onClick={openCreateUser}><Plus size={16} className="inline mr-1" />Add User</Btn>
          </div>
          {users.length === 0 ? (
            <EmptyState message="No team members" />
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand-100 text-brand-700">{ROLE_LABELS[u.role]}</Badge>
                    <button onClick={() => openEditUser(u)} className="p-1 text-slate-400 hover:text-brand-600"><Pencil size={16} /></button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={userModal} onClose={() => setUserModal(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSaveUser}>
          <FormField label="Name *"><TextInput value={userForm.name} onChange={(v) => setUserForm({ ...userForm, name: v })} required /></FormField>
          <FormField label="Email *"><TextInput value={userForm.email} onChange={(v) => setUserForm({ ...userForm, email: v })} type="email" required /></FormField>
          <FormField label={editingUser ? 'Password (leave blank to keep)' : 'Password *'}>
            <TextInput value={userForm.password} onChange={(v) => setUserForm({ ...userForm, password: v })} type="password" required={!editingUser} />
          </FormField>
          <FormField label="Role">
            <SelectInput
              value={userForm.role}
              onChange={(v) => setUserForm({ ...userForm, role: v as UserRole })}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'sales_manager', label: 'Sales Manager' },
                { value: 'sales_executive', label: 'Sales Executive' },
              ]}
            />
          </FormField>
          <div className="flex gap-2 mt-4">
            <Btn type="submit">{editingUser ? 'Update' : 'Create'}</Btn>
            <Btn variant="secondary" onClick={() => setUserModal(false)}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </PageHeader>
  );
}
