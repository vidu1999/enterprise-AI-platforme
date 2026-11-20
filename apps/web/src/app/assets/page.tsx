'use client';
import React, { useEffect, useState } from 'react';
import { Cpu, Plus, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Table from '@/components/Table';
import { api } from '@/lib/api';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', category: 'Power Generation', location: '' });
  const [error, setError] = useState('');

  const load = () =>
    api('/assets')
      .then(setAssets)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/assets', { method: 'POST', body: JSON.stringify(form) });
      setForm({ code: '', name: '', category: 'Power Generation', location: '' });
      setShowAdd(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Machines &amp; Equipment Assets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Physical equipment registry, operational health status, and preventive maintenance schedules
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Register Equipment</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      <Table
        columns={['Asset Code', 'Equipment Name', 'Category', 'Location', 'Status', 'Total Spend (Rs.)', 'Next Service']}
        rows={assets.map((a) => [
          <span key="c" className="font-mono text-xs font-bold text-[#00df82] flex items-center gap-1.5">
            <Cpu size={14} /> {a.code}
          </span>,
          <span key="n" className="font-semibold text-white">
            {a.name}
          </span>,
          a.category,
          a.location || 'Colombo Plant',
          <span
            key="s"
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              a.status === 'OPERATIONAL'
                ? 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {a.status}
          </span>,
          `Rs. ${Number(a.totalMaintenanceCost ?? 0).toLocaleString()}`,
          a.nextMaintenanceAt ? new Date(a.nextMaintenanceAt).toLocaleDateString() : 'Scheduled',
        ])}
      />

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Register Equipment</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={create} className="space-y-3.5 text-sm">
              <input
                required
                placeholder="Asset Code (e.g. GEN-002)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                placeholder="Equipment Name (e.g. Generator #2)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
