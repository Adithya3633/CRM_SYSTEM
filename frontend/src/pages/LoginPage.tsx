import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, TextInput, FormField } from '../components/UI';

const DEMO_ACCOUNTS = [
  { email: 'admin@crm.com', role: 'Admin' },
  { email: 'manager@crm.com', role: 'Sales Manager' },
  { email: 'john@crm.com', role: 'Sales Executive' },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register({ name, email, password, organizationName });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">CRM System</h1>
          <p className="text-slate-300 mt-2">Customer Relationship Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              {mode === 'login' ? 'Create an account' : 'Back to sign in'}
            </button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit}>
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
            <FormField label="Email">
              <TextInput value={email} onChange={setEmail} type="email" required />
            </FormField>
            <FormField label="Password">
              <TextInput value={password} onChange={setPassword} type="password" minLength={8} required />
            </FormField>
            <Btn type="submit" disabled={loading}>
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </Btn>
          </form>

          {mode === 'login' && <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-3">Demo accounts (password: password123)</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword('password123'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-50 border border-slate-200 transition-colors"
                >
                  <span className="font-medium">{acc.role}</span>
                  <span className="text-slate-400 ml-2">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
