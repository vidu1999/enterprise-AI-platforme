'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function SuppliersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', leadTimeDays: '5' });
  const [error, setError] = useState('');

  async function load() {
    setRows(await api('/suppliers'));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          leadTimeDays: Number(form.leadTimeDays || 5),
        }),
      });
      setForm({ name: '', email: '', phone: '', address: '', leadTimeDays: '5' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Approved MRO Vendors &amp; Suppliers</h1>
        <p className="text-sm text-slate-400 mb-6">
          Vendor directory, lead-time SLAs, and linked spare-parts catalog count
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">{error}</div>
        )}

        <form onSubmit={create} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Vendor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Sales Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Address / City" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input type="number" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Lead Days" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })} />
          <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm">
            + Add Vendor
          </button>
        </form>

        <Table
          columns={['Vendor Name', 'Email', 'Phone', 'Address', 'Lead Time', 'Linked SKUs']}
          rows={rows.map((s) => [
            <span key="n" className="font-semibold text-white">{s.name}</span>,
            s.email,
            s.phone,
            s.address,
            `${s.leadTimeDays ?? 5} days`,
            s.itemCount ?? 0,
          ])}
        />
      </main>
    </div>
  );
}
