'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function InventoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [banner, setBanner] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Spare Parts',
    quantity: '15',
    reorderLevel: '10',
    unitCost: '5000',
    supplierId: '',
  });

  async function load() {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (lowOnly) qs.set('lowStock', 'true');
    const [items, ledger, sups] = await Promise.all([
      api(`/inventory?${qs.toString()}`),
      api('/inventory/transactions?limit=12').catch(() => []),
      api('/suppliers').catch(() => []),
    ]);
    setRows(items);
    setTxs(ledger);
    setSuppliers(sups);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [lowOnly]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          category: form.category,
          quantity: Number(form.quantity),
          reorderLevel: Number(form.reorderLevel),
          unitCost: Number(form.unitCost),
          supplierId: form.supplierId || undefined,
        }),
      });
      setForm({ sku: '', name: '', category: 'Spare Parts', quantity: '15', reorderLevel: '10', unitCost: '5000', supplierId: '' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function adjust(id: string, type: 'IN' | 'OUT') {
    setError('');
    setBanner('');
    try {
      const res = await api(`/inventory/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ type, quantity: 1, note: `${type} via Inventory Console` }),
      });
      if (res.autoPurchaseOrder) {
        setBanner(
          `Workflow Automation Triggered: ${res.sku} dropped to ${res.quantity} (≤ ${res.reorderLevel}). Created ${res.autoPurchaseOrder.number} & routed to Approvals Queue!`,
        );
      }
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
            <h1 className="text-3xl font-bold text-white">MRO Inventory &amp; Stock Control</h1>
            <p className="text-sm text-slate-400">
              Falling at or below reorder threshold automatically generates a Purchase Request + Manager Approval
            </p>
          </div>
          <div className="flex gap-2">
            <input
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
              placeholder="Search SKU or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <button onClick={() => load()} className="px-3 py-2 rounded-lg bg-slate-800 text-sm">
              Search
            </button>
            <button
              onClick={() => setLowOnly(!lowOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                lowOnly
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              {lowOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}
            </button>
          </div>
        </div>

        {banner && (
          <div className="mb-5 p-4 rounded-xl bg-sky-950/80 border border-sky-500/50 text-sm text-sky-200">
            {banner}
          </div>
        )}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={create} className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="SKU (e.g. BRG-901)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <input className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Part description" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="number" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input type="number" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Reorder" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
          <select className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">Default Supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm">
            + Add SKU
          </button>
        </form>

        <Table
          columns={['SKU', 'Item', 'Supplier', 'On Hand', 'Reorder', 'Unit Cost', 'Health', 'Quick Adjust']}
          rows={rows.map((i) => [
            <span key="sku" className="font-mono text-sky-400 font-semibold">{i.sku}</span>,
            <div key="nm">
              <p className="font-medium text-white">{i.name}</p>
              <p className="text-xs text-slate-500">{i.category ?? 'General'} · {i.location ?? 'Central Store'}</p>
            </div>,
            i.supplier?.name ?? '—',
            <span key="q" className="font-semibold">{i.quantity} {i.unit}</span>,
            `${i.reorderLevel} ${i.unit}`,
            `LKR ${Number(i.unitCost ?? 0).toLocaleString()}`,
            i.isLowStock ? (
              <span key="low" className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                LOW STOCK
              </span>
            ) : (
              <span key="ok" className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300">
                HEALTHY
              </span>
            ),
            <div key="act" className="flex gap-1.5">
              <button
                type="button"
                onClick={() => adjust(i.id, 'IN')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300"
              >
                +1 In
              </button>
              <button
                type="button"
                onClick={() => adjust(i.id, 'OUT')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300"
              >
                −1 Out
              </button>
            </div>,
          ])}
        />

        {txs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent Stock Ledger Transactions</h2>
            <Table
              columns={['Timestamp', 'SKU', 'Part', 'Type', 'Qty', 'Actor', 'Note']}
              rows={txs.map((t) => [
                new Date(t.createdAt).toLocaleString(),
                <span key="s" className="font-mono text-xs text-sky-400">{t.sku}</span>,
                t.itemName,
                <span key="t" className={`text-xs font-bold ${t.type === 'IN' ? 'text-emerald-400' : 'text-amber-400'}`}>{t.type}</span>,
                `${t.quantity} ${t.unit}`,
                t.actorFirstName ? `${t.actorFirstName} ${t.actorLastName}` : 'System',
                t.note ?? '—',
              ])}
            />
          </div>
        )}
      </main>
    </div>
  );
}
