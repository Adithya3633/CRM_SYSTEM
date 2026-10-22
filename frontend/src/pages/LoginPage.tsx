import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TextInput, FormField } from '../components/UI';

const DEMO_ACCOUNTS = [
  { email: 'admin@crm.com', role: 'Admin', accountType: 'admin' as const },
  { email: 'manager@crm.com', role: 'Sales Manager', accountType: 'user' as const },
  { email: 'john@crm.com', role: 'Sales Executive', accountType: 'user' as const },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('password123');
  const [accountType, setAccountType] = useState<'admin' | 'user'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectAccountType = (type: 'admin' | 'user') => {
    setAccountType(type);
    setError('');
    const selectedDemo = DEMO_ACCOUNTS.find((account) => account.email === email);
    if (selectedDemo && selectedDemo.accountType !== type) {
      const matchingDemo = DEMO_ACCOUNTS.find((account) => account.accountType === type);
      if (matchingDemo) {
        setEmail(matchingDemo.email);
        setPassword('password123');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register({ name, email, password, organizationName });
      } else {
        await login(email, password, accountType);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] w-full items-stretch bg-white p-0">
      <div className="grid min-h-[100dvh] w-full overflow-hidden bg-white lg:grid-cols-[0.92fr_1.08fr]">
        <section
          className="relative flex min-h-[190px] flex-col justify-between overflow-hidden bg-[#142943] px-6 py-5 text-white sm:px-10 sm:py-6 lg:min-h-0 lg:px-12 lg:py-8"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '34px 34px' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700/35 via-transparent to-emerald-500/10" />
          <div className="relative z-10 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-black/20">
              <Briefcase size={21} strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-semibold tracking-wide">CRM System</p>
              <p className="mt-0.5 text-xs text-slate-300">Customer Relationship Management</p>
            </div>
          </div>

          <div className="relative z-10 mt-9 max-w-sm lg:mt-0">
            <p className="mb-3 text-xs font-semibold uppercase text-blue-200">Workspace access</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Good to have you back.</h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">Sign in to continue to your CRM workspace.</p>
          </div>

          <div className="relative z-10 hidden items-center gap-3 border-t border-white/15 pt-5 text-sm text-slate-300 lg:flex">
            <ShieldCheck size={18} className="text-emerald-300" />
            <span>Secure access for admins and team members</span>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-7 sm:px-10 sm:py-9 lg:px-16 lg:py-6">
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-brand-700">{mode === 'login' ? 'Welcome back' : 'Get started'}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
                <p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Enter your details to access your workspace.' : 'Set up your organization workspace.'}</p>
              </div>
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="shrink-0 pt-1 text-sm font-medium text-brand-700 transition-colors hover:text-brand-900"
              >
                {mode === 'login' ? 'Create account' : 'Sign in'}
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === 'login' && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Sign in as</p>
                <div className="grid grid-cols-2 gap-2" aria-label="Account type">
                  {(['admin', 'user'] as const).map((type) => {
                    const selected = accountType === type;
                    const RoleIcon = type === 'admin' ? ShieldCheck : UsersRound;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectAccountType(type)}
                        className={`flex min-h-[66px] items-center gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${selected ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <RoleIcon size={19} className={selected ? 'text-brand-700' : 'text-slate-400'} />
                        <span>
                          <span className="block text-sm font-semibold">{type === 'admin' ? 'Admin' : 'Normal User'}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{type === 'admin' ? 'Workspace owner' : 'Sales team'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <>
                  <FormField label="Your Name">
                    <TextInput value={name} onChange={setName} required />
                  </FormField>
                  <FormField label="Organization Name">
                    <TextInput value={organizationName} onChange={setOrganizationName} required />
                  </FormField>
                </>
              )}

              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    minLength={8}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in' : 'Create account')}
                {!loading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            {mode === 'login' && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">Demo accounts</p>
                  <p className="text-xs text-slate-500">Password: <span className="font-medium text-slate-700">password123</span></p>
                </div>
                <div className="divide-y divide-slate-100">
                  {DEMO_ACCOUNTS.map((account) => {
                    const selected = email === account.email;
                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => { setEmail(account.email); setPassword('password123'); setAccountType(account.accountType); setError(''); }}
                        className={`flex min-h-12 w-full items-center justify-between gap-3 px-2 text-left transition-colors hover:bg-slate-50 ${selected ? 'text-brand-800' : 'text-slate-700'}`}
                      >
                        <span className="text-sm font-medium">{account.role}</span>
                        <span className="truncate text-right text-xs text-slate-500">{account.email}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
