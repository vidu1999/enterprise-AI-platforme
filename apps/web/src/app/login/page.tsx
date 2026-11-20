'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setTokens } from '@/lib/api';

const DEMO_ACCOUNTS = [
  { label: 'Company Admin', email: 'admin@demo.local', role: 'COMPANY_ADMIN · Full tenant access' },
  { label: 'Operations Manager', email: 'manager@demo.local', role: 'MANAGER · Approvals, inventory & HR' },
  { label: 'Senior Technician', email: 'tech@demo.local', role: 'EMPLOYEE · Work orders & stock usage' },
  { label: 'Compliance Auditor', email: 'viewer@demo.local', role: 'VIEWER · Read-only KPIs, HR restricted' },
  { label: 'Tenant #2 (Port Logistics)', email: 'admin@colombologistics.local', role: 'Isolated second company proof' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('Demo1234!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doLogin(loginEmail: string, loginPass: string) {
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      setTokens(data.accessToken, data.refreshToken, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-stretch">
        <form
          onSubmit={submit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-slate-950 font-black text-sm">
                OP
              </span>
              <span className="text-xl font-bold text-white">OpsPilot</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Sign in to workspace</h1>
              <p className="text-xs text-slate-400 mt-1">
                JWT access token (15m) + rotated SHA-256 refresh token (7d)
              </p>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Work Email</label>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm focus:border-sky-500 outline-none"
                placeholder="admin@demo.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm focus:border-sky-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating…' : 'Sign in'}
            </button>
          </div>
          <p className="text-xs text-slate-400 pt-2">
            Onboarding a new organization?{' '}
            <Link className="text-sky-400 font-semibold hover:underline" href="/register">
              Create isolated tenant
            </Link>
          </p>
        </form>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-sky-400 mb-1">
              1-Click Role &amp; Multi-Tenant Demo
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Click any seeded persona below (all use password <code className="text-slate-200">Demo1234!</code>) to
              verify RBAC permissions and strict multi-company data isolation:
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Demo1234!');
                    doLogin(acc.email, 'Demo1234!');
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{acc.label}</span>
                    <span className="text-[11px] font-mono text-sky-400">{acc.email}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{acc.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
