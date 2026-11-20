'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function AssetsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', name: '', category: 'CNC Machining', location: '', maintenanceIntervalDays: '60' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setRows(await api('/assets'));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/assets', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          maintenanceIntervalDays: Number(form.maintenanceIntervalDays || 60),
        }),
      });
      setForm({ code: '', name: '', category: 'CNC Machining', location: '', maintenanceIntervalDays: '60' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function schedulePm(id: string, code: string) {
    setError('');
    setMessage('');
    try {
      await api(`/assets/${id}/schedule-maintenance`, { method: 'POST' });
      setMessage(`Preventive maintenance work order generated for ${code}.`);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Industrial Machines &amp; Assets</h1>
        <p className="text-sm text-slate-400 mb-6">
          Equipment registry, total lifecycle maintenance spend, and scheduled preventive intervals
        </p>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-sm text-emerald-200">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={create} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Code (e.g. CNC-205)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <input className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Equipment Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Plant Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input type="number" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="PM Interval (days)" value={form.maintenanceIntervalDays} onChange={(e) => setForm({ ...form, maintenanceIntervalDays: e.target.value })} />
          <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm">
            + Register Asset
          </button>
        </form>

        <Table
          columns={['Code', 'Equipment', 'Location', 'Status', 'Open Orders', 'Maint. Spend (LKR)', 'Next PM', 'Schedule']}
          rows={rows.map((a) => [
            <span key="c" className="font-mono text-sky-400 font-semibold">{a.code}</span>,
            <div key="n">
              <p className="font-medium text-white">{a.name}</p>
              <p className="text-xs text-slate-500">{a.category}</p>
            </div>,
            a.location,
            <span
              key="st"
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                a.status === 'OPERATIONAL' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {a.status}
            </span>,
            a.openWorkOrders ?? 0,
            Number(a.totalMaintenanceCost ?? 0).toLocaleString(),
            a.nextMaintenanceAt ? new Date(a.nextMaintenanceAt).toLocaleDateString() : '—',
            <button
              key="pm"
              onClick={() => schedulePm(a.id, a.code)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300"
            >
              + Schedule PM
            </button>,
          ])}
        />
      </main>
    </div>
  );
}
