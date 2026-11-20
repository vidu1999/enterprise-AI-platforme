'use client';
import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Download,
  Laptop,
  Monitor,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

function Sparkline({ color }: { color: string }) {
  return (
    <svg width="78" height="24" viewBox="0 0 78 24" fill="none" className="opacity-90">
      <path
        d="M2 18C12 16 16 9 25 12C34 15 41 6 51 9C61 12 67 4 76 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatLkr(val: number): string {
  if (val >= 1_000_000) return `Rs. ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `Rs. ${Math.round(val / 1_000)}K`;
  return `Rs. ${val.toLocaleString()}`;
}

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustDelta, setAdjustDelta] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Warehouse cycle count / restock');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Electronics',
    quantity: 15,
    reorderLevel: 5,
    unitCost: 45000,
    location: 'Colombo HQ Store',
    supplierId: '',
  });

  const load = () =>
    Promise.all([api('/inventory'), api('/suppliers')])
      .then(([inv, sup]) => {
        setItems(inv);
        setSuppliers(sup);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          reorderLevel: Number(form.reorderLevel),
          unitCost: Number(form.unitCost),
          supplierId: form.supplierId || undefined,
        }),
      });
      setShowAdd(false);
      setForm({
        sku: '',
        name: '',
        category: 'Electronics',
        quantity: 15,
        reorderLevel: 5,
        unitCost: 45000,
        location: 'Colombo HQ Store',
        supplierId: '',
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustItem) return;
    setError('');
    try {
      await api(`/inventory/${adjustItem.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          type: Number(adjustDelta) >= 0 ? 'IN' : 'OUT',
          quantity: Math.max(1, Math.abs(Number(adjustDelta))),
          note: adjustReason,
        }),
      });
      setAdjustItem(null);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function quickDepleteOne(item: any) {
    if (item.quantity <= 0) return;
    setError('');
    try {
      await api(`/inventory/${item.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ type: 'OUT', quantity: 1, note: 'Issued from stockroom' }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function exportCsv() {
    const header = 'SKU,Product,Category,Quantity,ReorderLevel,UnitCost_LKR,Location\n';
    const body = items
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}",${i.quantity},${i.reorderLevel},${i.unitCost},"${i.location || ''}"`,
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opspilot-inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalUnits = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const lowStockCount = items.filter((i) => i.quantity > 0 && i.quantity <= i.reorderLevel).length;
  const outOfStockCount = items.filter((i) => i.quantity === 0).length;
  const totalValue = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unitCost || 0), 0);

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  const filtered = items.filter((i) => {
    const hay = `${i.name} ${i.sku} ${i.category} ${i.location || ''}`.toLowerCase();
    if (search.trim() && !hay.includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'ALL' && i.category !== categoryFilter) return false;
    return true;
  });

  return (
    <AppShell>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-warehouse stock ledger, automated low-stock alerts, and LKR valuation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2.5 rounded-xl ops-card text-xs font-semibold text-slate-200 hover:border-emerald-500/40 flex items-center gap-2"
          >
            <Download size={15} className="text-slate-300" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="ops-card rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl ops-input text-sm placeholder:text-slate-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl ops-input text-xs font-medium cursor-pointer"
        >
          <option value="ALL">Category: All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              Category: {c}
            </option>
          ))}
        </select>
      </div>

      {/* 4 Sparkline KPI Cards matching Reference */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="ops-card rounded-2xl p-5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="h-7 w-7 rounded-lg bg-emerald-500/15 text-[#00df82] flex items-center justify-center">
                <Package size={15} />
              </span>
              <span>Total Items</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalUnits.toLocaleString()}</p>
          </div>
          <Sparkline color="#00df82" />
        </div>

        <div className="ops-card rounded-2xl p-5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <AlertTriangle size={15} />
              </span>
              <span>Low Stock</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{lowStockCount}</p>
          </div>
          <Sparkline color="#f59e0b" />
        </div>

        <div className="ops-card rounded-2xl p-5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="h-7 w-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <AlertCircle size={15} />
              </span>
              <span>Out of Stock</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{outOfStockCount}</p>
          </div>
          <Sparkline color="#f43f5e" />
        </div>

        <div className="ops-card rounded-2xl p-5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="h-7 w-7 rounded-lg bg-emerald-500/15 text-[#00df82] flex items-center justify-center">
                <Banknote size={15} />
              </span>
              <span>Total Value</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{formatLkr(totalValue)}</p>
          </div>
          <Sparkline color="#00df82" />
        </div>
      </div>

      {/* Products Table matching Reference */}
      <div className="ops-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-semibold text-slate-400">
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5">Unit Cost</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isOut = item.quantity === 0;
                const isLow = !isOut && item.quantity <= item.reorderLevel;
                const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
                const statusCls = isOut
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : isLow
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30';

                const ProdIcon =
                  item.category === 'Electronics'
                    ? item.name.toLowerCase().includes('monitor')
                      ? Monitor
                      : Laptop
                    : Package;

                return (
                  <tr
                    key={item.id}
                    className="border-b last:border-b-0 border-white/[0.045] hover:bg-emerald-500/[0.04] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                          <ProdIcon size={17} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {item.sku} · {item.location || 'Main Store'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{item.category}</td>
                    <td className="px-5 py-3.5 font-bold text-white">{item.quantity}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      Rs. {Number(item.unitCost).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustItem(item);
                            setAdjustDelta(10);
                          }}
                          className="h-8 w-8 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/25 text-sky-400 flex items-center justify-center"
                          title="Adjust Stock Quantity"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => quickDepleteOne(item)}
                          disabled={item.quantity <= 0}
                          className="h-8 w-8 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-rose-400 disabled:opacity-35 flex items-center justify-center"
                          title="Issue 1 Unit (-1)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Inventory Product</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <input
                required
                placeholder="SKU (e.g. IT-UPS-009)"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                placeholder="Product Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                placeholder="Category (Electronics, Spare Parts...)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                placeholder="Warehouse Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Initial Quantity</label>
                <input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl ops-input"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Reorder Level</label>
                <input
                  type="number"
                  min={0}
                  value={form.reorderLevel}
                  onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl ops-input"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Unit Cost (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl ops-input"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Preferred Supplier</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl ops-input"
                >
                  <option value="">None</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Ledger Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Adjust Stock · {adjustItem.name}</h2>
              <button onClick={() => setAdjustItem(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Current Stock: <strong className="text-white">{adjustItem.quantity}</strong> units (Reorder point:{' '}
              {adjustItem.reorderLevel})
            </p>
            <form onSubmit={submitAdjust} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Quantity Delta (+ restock / - consume)</label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ledger Reason</label>
                <input
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Commit Ledger Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
