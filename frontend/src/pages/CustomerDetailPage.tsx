import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { api } from '../api';
import { Customer } from '../types';
import { formatCurrency, formatDate } from '../utils';
import PageHeader, { Btn, Modal, FormField, TextInput, TextArea, Badge, EmptyState } from '../components/UI';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'contact' | 'purchase' | 'note' | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [purchaseForm, setPurchaseForm] = useState({ product: '', amount: '', purchase_date: '', notes: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '', meeting_date: '' });

  const load = () => {
    api.getCustomer(Number(id)).then(setCustomer).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addContact(Number(id), contactForm);
    setModal(null);
    setContactForm({ name: '', email: '', phone: '', role: '' });
    load();
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addPurchase(Number(id), { ...purchaseForm, amount: Number(purchaseForm.amount) });
    setModal(null);
    setPurchaseForm({ product: '', amount: '', purchase_date: '', notes: '' });
    load();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addNote(Number(id), noteForm);
    setModal(null);
    setNoteForm({ title: '', content: '', meeting_date: '' });
    load();
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!customer) return <EmptyState message="Customer not found" />;

  const totalPurchases = customer.purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <PageHeader
      title={customer.name}
      subtitle={customer.company || undefined}
      action={
        <Btn variant="secondary" onClick={() => navigate('/customers')}>
          <ArrowLeft size={16} className="inline mr-1" />Back
        </Btn>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Customer Details</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{customer.email || '—'}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{customer.phone || '—'}</dd></div>
            <div><dt className="text-slate-500">Company</dt><dd className="font-medium">{customer.company || '—'}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd><Badge className={customer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{customer.status}</Badge></dd></div>
            <div className="col-span-2"><dt className="text-slate-500">Address</dt><dd className="font-medium">{customer.address || '—'}</dd></div>
            <div><dt className="text-slate-500">Assigned To</dt><dd className="font-medium">{customer.assigned_name || '—'}</dd></div>
            <div><dt className="text-slate-500">Total Purchases</dt><dd className="font-medium text-brand-600">{formatCurrency(totalPurchases)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Contacts</h3>
            <button onClick={() => setModal('contact')} className="text-brand-600 hover:text-brand-700"><Plus size={18} /></button>
          </div>
          {customer.contacts?.length === 0 ? (
            <p className="text-sm text-slate-400">No contacts</p>
          ) : (
            <div className="space-y-3">
              {customer.contacts?.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="font-medium text-sm">{c.name} {c.is_primary ? <Badge className="bg-brand-100 text-brand-700 ml-1">Primary</Badge> : null}</p>
                  <p className="text-xs text-slate-500">{c.role}</p>
                  <p className="text-xs text-slate-500">{c.email} · {c.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Purchase History</h3>
            <button onClick={() => setModal('purchase')} className="text-brand-600 hover:text-brand-700"><Plus size={18} /></button>
          </div>
          {customer.purchases?.length === 0 ? (
            <p className="text-sm text-slate-400">No purchases</p>
          ) : (
            <div className="space-y-3">
              {customer.purchases?.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm">{p.product}</p>
                    <p className="text-sm font-semibold text-brand-600">{formatCurrency(p.amount)}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(p.purchase_date)}</p>
                  {p.notes && <p className="text-xs text-slate-400 mt-1">{p.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Meeting Notes</h3>
            <button onClick={() => setModal('note')} className="text-brand-600 hover:text-brand-700"><Plus size={18} /></button>
          </div>
          {customer.meeting_notes?.length === 0 ? (
            <p className="text-sm text-slate-400">No meeting notes</p>
          ) : (
            <div className="space-y-3">
              {customer.meeting_notes?.map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(n.meeting_date)} · {n.author_name}</p>
                  {n.content && <p className="text-sm text-slate-600 mt-1">{n.content}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modal === 'contact'} onClose={() => setModal(null)} title="Add Contact">
        <form onSubmit={handleAddContact}>
          <FormField label="Name *"><TextInput value={contactForm.name} onChange={(v) => setContactForm({ ...contactForm, name: v })} required /></FormField>
          <FormField label="Email"><TextInput value={contactForm.email} onChange={(v) => setContactForm({ ...contactForm, email: v })} /></FormField>
          <FormField label="Phone"><TextInput value={contactForm.phone} onChange={(v) => setContactForm({ ...contactForm, phone: v })} /></FormField>
          <FormField label="Role"><TextInput value={contactForm.role} onChange={(v) => setContactForm({ ...contactForm, role: v })} /></FormField>
          <Btn type="submit">Add Contact</Btn>
        </form>
      </Modal>

      <Modal open={modal === 'purchase'} onClose={() => setModal(null)} title="Add Purchase">
        <form onSubmit={handleAddPurchase}>
          <FormField label="Product *"><TextInput value={purchaseForm.product} onChange={(v) => setPurchaseForm({ ...purchaseForm, product: v })} required /></FormField>
          <FormField label="Amount ($) *"><TextInput value={purchaseForm.amount} onChange={(v) => setPurchaseForm({ ...purchaseForm, amount: v })} type="number" required /></FormField>
          <FormField label="Date *"><TextInput value={purchaseForm.purchase_date} onChange={(v) => setPurchaseForm({ ...purchaseForm, purchase_date: v })} type="date" required /></FormField>
          <FormField label="Notes"><TextArea value={purchaseForm.notes} onChange={(v) => setPurchaseForm({ ...purchaseForm, notes: v })} /></FormField>
          <Btn type="submit">Add Purchase</Btn>
        </form>
      </Modal>

      <Modal open={modal === 'note'} onClose={() => setModal(null)} title="Add Meeting Note">
        <form onSubmit={handleAddNote}>
          <FormField label="Title *"><TextInput value={noteForm.title} onChange={(v) => setNoteForm({ ...noteForm, title: v })} required /></FormField>
          <FormField label="Meeting Date *"><TextInput value={noteForm.meeting_date} onChange={(v) => setNoteForm({ ...noteForm, meeting_date: v })} type="date" required /></FormField>
          <FormField label="Content"><TextArea value={noteForm.content} onChange={(v) => setNoteForm({ ...noteForm, content: v })} rows={4} /></FormField>
          <Btn type="submit">Add Note</Btn>
        </form>
      </Modal>
    </PageHeader>
  );
}
