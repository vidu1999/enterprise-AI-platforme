'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setTokens } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      setTokens(data.accessToken, data.refreshToken, data.user);
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); }
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
        <h1 className="text-2xl font-bold text-sky-400">OpsPilot</h1>
        <h2 className="text-lg font-semibold">Create your company</h2>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <input className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700" placeholder="Company name" onChange={set('companyName')} required />
        <input className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700" placeholder="First name" onChange={set('firstName')} required />
        <input className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700" placeholder="Last name" onChange={set('lastName')} required />
        <input className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700" placeholder="Email" onChange={set('email')} required />
        <input type="password" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700" placeholder="Password (min 8 chars)" onChange={set('password')} required />
        <button className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 font-semibold">Create company</button>
        <p className="text-sm text-slate-400">Have an account? <Link className="text-sky-400" href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
