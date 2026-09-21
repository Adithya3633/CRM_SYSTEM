export type UserRole = 'admin' | 'sales_manager' | 'sales_executive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  organization_id: number;
}

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: LeadStage;
  value: number;
  source: string | null;
  notes: string | null;
  organization_id: number;
  assigned_to: number;
  assigned_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: string;
  organization_id: number;
  assigned_to: number;
  assigned_name?: string;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  purchases?: Purchase[];
  meeting_notes?: MeetingNote[];
}

export interface Contact {
  id: number;
  customer_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: number;
}

export interface Purchase {
  id: number;
  customer_id: number;
  product: string;
  amount: number;
  purchase_date: string;
  notes: string | null;
}

export interface MeetingNote {
  id: number;
  customer_id: number;
  user_id: number;
  title: string;
  content: string | null;
  meeting_date: string;
  author_name?: string;
}

export interface Organization {
  id: number;
  name: string;
  industry: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface DashboardData {
  kpis: {
    revenue: number;
    leadConversionRate: number;
    totalLeads: number;
    activeLeads: number;
    wonLeads: number;
    lostLeads: number;
    totalCustomers: number;
  };
  leadsByStage: { stage: string; count: number; value: number }[];
  monthlySales: { month: string; revenue: number; deals: number }[];
  teamPerformance: { id: number; name: string; total_leads: number; won_deals: number; revenue: number }[];
  recentLeads: Lead[];
}

export const LEAD_STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'new', label: 'New Lead', color: 'bg-slate-100 text-slate-700' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-700' },
  { key: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
};
