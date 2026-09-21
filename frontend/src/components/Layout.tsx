import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, Building2, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../types';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'sales_manager', 'sales_executive'] },
  { to: '/leads', icon: UserCheck, label: 'Leads', roles: ['admin', 'sales_manager', 'sales_executive'] },
  { to: '/customers', icon: Users, label: 'Customers', roles: ['admin', 'sales_manager', 'sales_executive'] },
  { to: '/admin', icon: Building2, label: 'Admin', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-900 text-white flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight">CRM System</h1>
          <p className="text-slate-400 text-sm mt-1">Customer Relationship Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu size={22} />
          </button>
          <span className="font-semibold">CRM System</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 hidden">
            <X size={22} />
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
