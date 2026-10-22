const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

function getToken(): string | null {
  return localStorage.getItem('crm_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const errorBody: unknown = await res.json().catch(() => null);
    if (errorBody && typeof errorBody === 'object') {
      const body = errorBody as Record<string, unknown>;
      const message = typeof body.error === 'string'
        ? body.error
        : typeof body.detail === 'string'
          ? body.detail
          : Object.entries(body)
            .map(([field, value]) => {
              const details = Array.isArray(value) ? value.join(', ') : value;
              return typeof details === 'string' ? `${field}: ${details}` : null;
            })
            .filter((detail): detail is string => detail !== null)
            .join('; ');
      throw new Error(message || `Request failed (${res.status})`);
    }
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  register: (data: { name: string; email: string; password: string; organizationName: string }) =>
    request<{ token: string; user: import('./types').User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (email: string, password: string, accountType: 'admin' | 'user') =>
    request<{ token: string; user: import('./types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, account_type: accountType }),
    }),

  getMe: () => request<import('./types').User>('/auth/me'),

  getUsers: () => request<import('./types').User[]>('/auth/users'),
  createUser: (data: { name: string; email: string; password: string; role: string }) =>
    request('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: Partial<{ name: string; email: string; role: string; password: string }>) =>
    request(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request(`/auth/users/${id}`, { method: 'DELETE' }),

  getOrganization: () => request<import('./types').Organization>('/organization'),
  updateOrganization: (data: Partial<import('./types').Organization>) =>
    request('/organization', { method: 'PUT', body: JSON.stringify(data) }),

  getLeads: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('./types').Lead[]>(`/leads${qs}`);
  },
  getLead: (id: number) => request<import('./types').Lead>(`/leads/${id}`),
  createLead: (data: Partial<import('./types').Lead>) =>
    request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: number, data: Partial<import('./types').Lead>) =>
    request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLeadStage: (id: number, stage: string) =>
    request(`/leads/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  deleteLead: (id: number) => request(`/leads/${id}`, { method: 'DELETE' }),

  getCustomers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('./types').Customer[]>(`/customers${qs}`);
  },
  getCustomer: (id: number) => request<import('./types').Customer>(`/customers/${id}`),
  createCustomer: (data: Partial<import('./types').Customer>) =>
    request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: number, data: Partial<import('./types').Customer>) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: number) => request(`/customers/${id}`, { method: 'DELETE' }),
  addContact: (customerId: number, data: { name: string; email?: string; phone?: string; role?: string; is_primary?: boolean }) =>
    request(`/customers/${customerId}/contacts`, { method: 'POST', body: JSON.stringify(data) }),
  addPurchase: (customerId: number, data: { product: string; amount: number; purchase_date: string; notes?: string }) =>
    request(`/customers/${customerId}/purchases`, { method: 'POST', body: JSON.stringify(data) }),
  addNote: (customerId: number, data: { title: string; content?: string; meeting_date: string }) =>
    request(`/customers/${customerId}/notes`, { method: 'POST', body: JSON.stringify(data) }),

  getDashboard: () => request<import('./types').DashboardData>('/dashboard'),
};
