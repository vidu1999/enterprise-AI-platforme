'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Building2, Lock, Mail, User } from 'lucide-react';
import { api, setTokens } from '@/lib/api';
import OpsLogo from '@/components/OpsLogo';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    industry: 'Manufacturing',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      setTokens(data.accessToken, data.refreshToken, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#060d17] text-white px-4 py-10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-hq-bg.jpg')" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, rgba(5,12,21,0.88) 0%, rgba(6,16,28,0.68) 50%, rgba(6,14,24,0.90) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="flex justify-center mb-6">
          <OpsLogo size="lg" subtitle="Smarter Operations. Greater Productivity." />
        </div>

        <div className="rounded-[28px] bg-[#091320]/90 backdrop-blur-2xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.65)] p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Create Organization</h1>
            <p className="text-sm text-slate-400 mt-1">Provision an isolated multi-tenant workspace</p>
          </div>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Company Name (e.g. OpsPilot Lanka Pvt Ltd)"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111e2e]/90 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00df82]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="First Name"
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#111e2e]/90 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00df82]"
                />
              </div>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Last Name"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-[#111e2e]/90 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00df82]"
              />
            </div>

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Work Email Address"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111e2e]/90 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00df82]"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password (minimum 8 characters)"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111e2e]/90 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00df82]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl ops-btn-primary font-bold text-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Provisioning Workspace…' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#00df82] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
