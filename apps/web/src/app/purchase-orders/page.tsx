'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function PurchaseOrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ supplierId: '', itemId: '', quantity: '10', unitCost: '5000' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const [p, s, i] = await Promise.all([
      api('/purchase-orders'),
      api('/suppliers'),
      api('/inventory'),
    ]);
    setRows(p);
    setSuppliers(s);
    setItems(i);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: form.supplierId,
          lines: [{ itemId: form.itemId, quantity: Number(form.quantity), unitCost: Number(form.unitCost) }],
        }),
      });
      setMessage('Purchase order created and routed to Approvals Queue.');
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function receive(id: string) {
    setError('');
    setMessage('');
    try {
      const r = await api(`/purchase-orders/${id}/receive`, { method: 'POST' });
      setMessage(`Received ${r.number} — inventory stock levels automatically replenished.`);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Purchase Orders</h1>
        <p className="text-sm text-slate-400 mb-6">
          Manual &amp; automated low-stock procurement requests with approval gating and goods receipt
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

        <form onSubmit={create} className="flex flex-wrap gap-2 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <select
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            required
          >
            <option value="">Select Supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            value={form.itemId}
            onChange={(e) => {
              const found = items.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                itemId: e.target.value,
                unitCost: found?.unitCost ? String(found.unitCost) : form.unitCost,
              });
            }}
            required
          >
            <option value="">Select MRO Item…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            className="w-24 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            placeholder="Qty"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <input
            type="number"
            min={0}
            className="w-32 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
            placeholder="Unit Cost"
            value={form.unitCost}
            onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
          />
          <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm">
            Create PO
          </button>
        </form>

        <Table
          columns={['PO Number', 'Supplier', 'Line Items', 'Origin', 'Total (LKR)', 'Status', 'Warehouse Action']}
          rows={rows.map((p) => [
            <span key="n" className="font-mono text-sky-400 font-semibold">{p.number}</span>,
            p.supplier?.name,
            <div key="l" className="text-xs text-slate-300 space-y-0.5">
              {(p.lines ?? []).map((ln: any) => (
                <div key={ln.id}>{ln.item?.sku}: {ln.quantity} × {Number(ln.unitCost).toLocaleString()}</div>
              ))}
            </div>,
            p.autoGenerated ? (
              <span key="a" className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300">
                AUTO-WORKFLOW
              </span>
            ) : (
              <span key="m" className="text-xs text-slate-400">Manual</span>
            ),
            Number(p.total ?? 0).toLocaleString(),
            <span
              key="s"
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                p.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : p.status === 'RECEIVED'
                    ? 'bg-sky-500/20 text-sky-300'
                    : p.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {p.status}
            </span>,
            p.status === 'APPROVED' ? (
              <button
                key="btn"
                onClick={() => receive(p.id)}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Receive Goods
              </button>
            ) : (
              <span key="none" className="text-xs text-slate-500">—</span>
            ),
          ])}
        />
      </main>
    </div>
  );
}
