'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Plus, ShoppingCart, Truck, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Table from '@/components/Table';
import { api } from '@/lib/api';

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ supplierId: '', inventoryItemId: '', quantity: 10, unitCost: 25000, notes: '' });
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api('/purchase-orders'), api('/suppliers'), api('/inventory')])
      .then(([p, s, i]) => {
        setPos(p);
        setSuppliers(s);
        setItems(i);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: form.supplierId,
          notes: form.notes || undefined,
          lines: [
            {
              itemId: form.inventoryItemId,
              quantity: Number(form.quantity),
              unitCost: Number(form.unitCost),
            },
          ],
        }),
      });
      setShowCreate(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function receive(id: string) {
    setError('');
    try {
      await api(`/purchase-orders/${id}/receive`, { method: 'POST' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Purchasing &amp; Purchase Orders</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated approval routing and atomic inventory stock replenishment upon receipt
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/suppliers"
            className="px-3.5 py-2.5 rounded-xl ops-card text-xs font-semibold text-slate-200 hover:border-emerald-500/40 flex items-center gap-2"
          >
            <Truck size={15} className="text-[#00df82]" />
            <span>Suppliers ({suppliers.length})</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      <Table
        columns={['PO Number', 'Supplier', 'Items', 'Total (Rs.)', 'Status', 'Action']}
        rows={pos.map((p) => {
          const stCls =
            p.status === 'APPROVED' || p.status === 'RECEIVED'
              ? 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30'
              : p.status === 'PENDING_APPROVAL'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30';
          return [
            <span key="n" className="font-mono font-bold text-white flex items-center gap-2">
              <ShoppingCart size={14} className="text-[#00df82]" /> #{p.number}
            </span>,
            p.supplier?.name,
            `${p.lines?.length ?? 0} line(s)`,
            <span key="t" className="font-bold text-white">
              Rs. {Number(p.total).toLocaleString()}
            </span>,
            <span key="s" className={`px-3 py-1 rounded-full text-xs font-semibold border ${stCls}`}>
              {p.status}
            </span>,
            p.status === 'APPROVED' ? (
              <button
                key="r"
                onClick={() => receive(p.id)}
                className="px-3 py-1.5 rounded-xl ops-btn-primary text-xs font-bold inline-flex items-center gap-1"
              >
                <CheckCircle2 size={13} /> Mark Received (+Stock)
              </button>
            ) : p.status === 'PENDING_APPROVAL' ? (
              <Link key="w" href="/approvals" className="text-xs font-semibold text-[#00df82] hover:underline">
                Approve in Workflow →
              </Link>
            ) : (
              <span key="d" className="text-xs text-slate-500">
                Completed
              </span>
            ),
          ];
        })}
      />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Create Purchase Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <select
                required
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl ops-input"
              >
                <option value="">Select Supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                required
                value={form.inventoryItemId}
                onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl ops-input"
              >
                <option value="">Select Inventory Product…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.sku} — {i.name} (Stock: {i.quantity})
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Order Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Unit Cost (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                />
              </div>
              <input
                placeholder="Notes / Delivery instructions"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl ops-input"
              />
              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
