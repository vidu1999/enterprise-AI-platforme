'use client';
import React, { useEffect, useState } from 'react';
import { Plus, Star, Truck, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Table from '@/components/Table';
import { api } from '@/lib/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', leadTimeDays: 5 });
  const [error, setError] = useState('');

  const load = () =>
    api('/suppliers')
      .then(setSuppliers)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          leadTimeDays: Number(form.leadTimeDays),
        }),
      });
      setForm({ name: '', email: '', phone: '', address: '', leadTimeDays: 5 });
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Suppliers &amp; Vendors</h1>
          <p className="text-xs text-slate-400 mt-1">
            Approved vendor directory, contact points, and procurement performance ratings
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add Supplier</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      <Table
        columns={['Vendor Name', 'Email', 'Phone', 'Address', 'Lead Time', 'Linked SKUs']}
        rows={suppliers.map((s) => [
          <span key="n" className="font-semibold text-white flex items-center gap-2">
            <Truck size={15} className="text-[#00df82]" /> {s.name}
          </span>,
          s.email,
          s.phone,
          s.address || 'Colombo',
          <span key="r" className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs">
            <Star size={13} fill="currentColor" /> {s.leadTimeDays ?? 5} days
          </span>,
          s.itemCount ?? 0,
        ])}
      />

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Approved Vendor</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={create} className="space-y-3.5 text-sm">
              <input
                required
                placeholder="Supplier Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                placeholder="Address (e.g. Colombo 03)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                type="email"
                placeholder="Vendor Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                placeholder="Phone (+94 ...)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
