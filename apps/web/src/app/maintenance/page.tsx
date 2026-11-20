'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function MaintenancePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    assetId: '',
    assigneeId: '',
    estimatedCost: '45000',
  });

  async function load() {
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    const [orders, assetList, userList] = await Promise.all([
      api(`/work-orders${qs}`),
      api('/assets').catch(() => []),
      api('/users').catch(() => []),
    ]);
    setRows(orders);
    setAssets(assetList);
    setUsers(userList);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [statusFilter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          priority: form.priority,
          assetId: form.assetId || undefined,
          assigneeId: form.assigneeId || undefined,
          estimatedCost: Number(form.estimatedCost || 0),
        }),
      });
      setForm({ title: '', description: '', priority: 'HIGH', assetId: '', assigneeId: '', estimatedCost: '45000' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function setStatus(id: string, status: string, estCost: number) {
    setError('');
    try {
      await api(`/work-orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...(status === 'COMPLETED' && estCost > 0 ? { actualCost: estCost } : {}),
        }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Maintenance Work Orders</h1>
            <p className="text-sm text-slate-400">
              Corrective breakdowns, preventive schedules, technician assignments, and cost tracking
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st || 'ALL'}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  statusFilter === st ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                {st || 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <input
            className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            placeholder="Work order title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            value={form.assetId}
            onChange={(e) => setForm({ ...form, assetId: e.target.value })}
          >
            <option value="">Machine / Asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          >
            <option value="">Assign Technician…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
            <option>CRITICAL</option>
          </select>
          <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm">
            + Dispatch Order
          </button>
        </form>

        <Table
          columns={['Work Order', 'Asset', 'Priority', 'Status', 'Assignee', 'Cost (LKR)', 'Actions']}
          rows={rows.map((o) => [
            <div key="t">
              <p className="font-medium text-white">{o.title}</p>
              {o.description && <p className="text-xs text-slate-500 line-clamp-1">{o.description}</p>}
            </div>,
            o.asset ? (
              <span key="a" className="font-mono text-xs text-sky-400">{o.asset.code}</span>
            ) : (
              '—'
            ),
            <span
              key="p"
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                o.priority === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300'
                  : o.priority === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-300'
              }`}
            >
              {o.priority}
            </span>,
            <span
              key="s"
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                o.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : o.status === 'IN_PROGRESS'
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'bg-slate-800 text-slate-300'
              }`}
            >
              {o.status}
            </span>,
            o.assignee ? `${o.assignee.firstName} ${o.assignee.lastName}` : 'Unassigned',
            Number(o.actualCost || o.estimatedCost || 0).toLocaleString(),
            o.status !== 'COMPLETED' ? (
              <div key="act" className="flex gap-1.5">
                {o.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => setStatus(o.id, 'IN_PROGRESS', o.estimatedCost)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300"
                  >
                    Start
                  </button>
                )}
                <button
                  onClick={() => setStatus(o.id, 'COMPLETED', o.estimatedCost)}
                  className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-semibold text-emerald-300"
                >
                  Complete
                </button>
              </div>
            ) : (
              <span key="done" className="text-xs text-slate-500">Closed</span>
            ),
          ])}
        />
      </main>
    </div>
  );
}
