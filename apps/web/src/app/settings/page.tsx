'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const c = await api('/companies/me');
    setCompany(c);
    setForm({
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      industry: c.industry ?? '',
      currency: c.currency ?? 'LKR',
      timezone: c.timezone ?? 'Asia/Colombo',
    });
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await api('/companies/me', { method: 'PATCH', body: JSON.stringify(form) });
      setSaved(true);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-1">Tenant Organization Settings</h1>
        <p className="text-sm text-slate-400 mb-6">
          Configure company identity, currency, and regional defaults (Admin gated)
        </p>

        {company && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p>
              Tenant Slug: <code className="text-sky-400">{company.slug}</code>
            </p>
            <p>
              Tenant UUID: <code className="text-slate-300">{company.id}</code>
            </p>
          </div>
        )}

        {saved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-sm text-emerald-200">
            Tenant settings updated.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">{error}</div>
        )}

        <form onSubmit={save} className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Organization Name</label>
            <input className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Operations Email</label>
              <input className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone</label>
              <input className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Currency</label>
              <input className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Timezone</label>
              <input className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Plant / Head Office Address</label>
            <input className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <button className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm">
            Save Settings
          </button>
        </form>
      </main>
    </div>
  );
}
