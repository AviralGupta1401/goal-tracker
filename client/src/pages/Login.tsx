import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/api';
import { User } from '@/types';

export default function Login({ setUser }: { setUser: (user: User | null) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      navigate(`/${data.user.role === 'employee' ? 'employee' : data.user.role === 'manager' ? 'manager' : 'admin'}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    const credentials = {
      admin: { email: 'admin@company.com', password: 'admin123' },
      manager: { email: 'manager@company.com', password: 'manager123' },
      employee: { email: 'alice@company.com', password: 'employee123' },
    };
    const cred = credentials[role as keyof typeof credentials];
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.login(cred);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      navigate(`/${data.user.role === 'employee' ? 'employee' : data.user.role === 'manager' ? 'manager' : 'admin'}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      setError(msg + ' — Check that VITE_API_URL is set in Vercel');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">GoalTracker</h1>
            <p className="text-slate-600 mt-2">In-House Goal Setting & Tracking Portal</p>
          </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg mb-4 text-xs">
        Backend: {import.meta.env.VITE_API_URL || 'http://localhost:3001'}
      </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center mb-4">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => quickLogin('admin')} className="btn-secondary text-xs">
                Admin
              </button>
              <button type="button" onClick={() => quickLogin('manager')} className="btn-secondary text-xs">
                Manager
              </button>
              <button type="button" onClick={() => quickLogin('employee')} className="btn-secondary text-xs">
                Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
