'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, Cpu, Plus, Search, Wrench, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

type TabKey = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'OVERDUE', label: 'Overdue' },
];

export default function MaintenancePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    assetId: '',
    assigneeId: '',
    estimatedCost: 45000,
    dueDate: '',
  });

  const load = () =>
    Promise.all([api('/work-orders'), api('/assets'), api('/users')])
      .then(([wo, as, us]) => {
        setOrders(wo);
        setAssets(as);
        setUsers(us);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function createOrder(e: React.FormEvent) {
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
          estimatedCost: Number(form.estimatedCost),
          dueDate: form.dueDate || undefined,
        }),
      });
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        priority: 'HIGH',
        assetId: '',
        assigneeId: '',
        estimatedCost: 45000,
        dueDate: '',
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function changeStatus(id: string, status: string, estCost: number) {
    setError('');
    try {
      await api(`/work-orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          actualCost: status === 'COMPLETED' ? estCost || 40000 : undefined,
        }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const now = Date.now();
  const isOverdue = (w: any) =>
    w.status !== 'COMPLETED' && w.status !== 'CANCELLED' && w.dueDate && new Date(w.dueDate).getTime() < now;

  const openCount = orders.filter((w) => w.status === 'OPEN' || w.status === 'ASSIGNED').length;
  const inProgressCount = orders.filter((w) => w.status === 'IN_PROGRESS').length;
  const completedCount = orders.filter((w) => w.status === 'COMPLETED').length;
  const overdueCount = orders.filter(isOverdue).length;

  const filtered = orders.filter((w, idx) => {
    const orderCode = `WO-${1042 - idx}`;
    const hay = `${orderCode} ${w.title} ${w.asset?.name || ''} ${w.priority}`.toLowerCase();
    if (search.trim() && !hay.includes(search.toLowerCase())) return false;
    if (activeTab === 'OPEN') return w.status === 'OPEN' || w.status === 'ASSIGNED';
    if (activeTab === 'IN_PROGRESS') return w.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return w.status === 'COMPLETED';
    if (activeTab === 'OVERDUE') return isOverdue(w);
    return true;
  });

  return (
    <AppShell>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance &amp; Work Orders</h1>
          <p className="text-xs text-slate-400 mt-1">
            Equipment dispatch, SLA due-date tracking, and automated escalation approvals
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/assets"
            className="px-3.5 py-2.5 rounded-xl ops-card text-xs font-semibold text-slate-200 hover:border-emerald-500/40 flex items-center gap-2"
          >
            <Cpu size={15} className="text-[#00df82]" />
            <span>Equipment ({assets.length})</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* 4 KPI Summary Cards matching Reference */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="ops-card rounded-2xl p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-400 flex items-center justify-center shrink-0">
            <Wrench size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Open</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{openCount}</p>
          </div>
        </div>

        <div className="ops-card rounded-2xl p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-400/25 text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">In Progress</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{inProgressCount}</p>
          </div>
        </div>

        <div className="ops-card rounded-2xl p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/15 border border-emerald-400/25 text-[#00df82] flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Completed</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{completedCount}</p>
          </div>
        </div>

        <div className="ops-card rounded-2xl p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-rose-500/15 border border-rose-400/25 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Overdue</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs + Search Card */}
      <div className="ops-card rounded-2xl overflow-hidden">
        <div className="px-5 pt-3 pb-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'border-[#00df82] text-[#00df82]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work orders..."
              className="w-full pl-9 pr-3 py-2 rounded-xl ops-input text-xs placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Work Orders Table matching Reference */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-semibold text-slate-400">
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-5 py-3.5">Asset</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, idx) => {
                const orderId = `WO-${1042 - idx}`;
                const overdue = isOverdue(w);
                const priCls =
                  w.priority === 'URGENT' || w.priority === 'HIGH'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : w.priority === 'MEDIUM'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30';

                const priLabel =
                  w.priority === 'URGENT'
                    ? 'Urgent'
                    : w.priority === 'HIGH'
                      ? 'High'
                      : w.priority === 'MEDIUM'
                        ? 'Medium'
                        : 'Low';

                const statusCls = overdue
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : w.status === 'COMPLETED'
                    ? 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30'
                    : w.status === 'IN_PROGRESS'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-sky-500/15 text-sky-300 border-sky-500/30';

                const statusDisplay = overdue
                  ? 'Overdue'
                  : w.status === 'IN_PROGRESS'
                    ? 'In Progress'
                    : w.status === 'COMPLETED'
                      ? 'Completed'
                      : 'Open';

                return (
                  <tr
                    key={w.id}
                    className="border-b last:border-b-0 border-white/[0.045] hover:bg-emerald-500/[0.04] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-300">{orderId}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{w.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Est. Rs. {Number(w.estimatedCost || 0).toLocaleString()}
                        {w.assignee ? ` · ${w.assignee.firstName} ${w.assignee.lastName}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{w.asset?.name || 'Facility General'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${priCls}`}>
                        {priLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCls}`}>
                          {statusDisplay}
                        </span>
                        <select
                          aria-label="Update status"
                          value={w.status}
                          onChange={(e) => changeStatus(w.id, e.target.value, Number(w.estimatedCost || 0))}
                          className="bg-[#0c1625] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 cursor-pointer"
                        >
                          {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300 whitespace-nowrap">
                      {w.dueDate
                        ? new Date(w.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Create Work Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createOrder} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <input
                required
                placeholder="Work Order Title (e.g. Generator #1 Oil Service)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl ops-input"
              />
              <select
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              >
                <option value="">Select Equipment / Asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              >
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                  <option key={p} value={p}>
                    Priority: {p}
                  </option>
                ))}
              </select>
              <select
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              >
                <option value="">Assign Technician (Optional)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                placeholder="Estimated Cost (Rs.)"
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Technical notes or SOP checklist..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl ops-input"
              />
              <p className="sm:col-span-2 text-[11px] text-slate-400">
                Note: URGENT priority or estimated cost &ge; Rs. 2,500 automatically triggers a Workflow Approval.
              </p>
              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
