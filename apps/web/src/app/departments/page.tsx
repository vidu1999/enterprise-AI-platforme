'use client';
import React, { useEffect, useState } from 'react';
import { Building2, Plus, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Table from '@/components/Table';
import { api } from '@/lib/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState('');

  const load = () =>
    api('/departments')
      .then(setDepartments)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/departments', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, description: form.description || undefined }),
      });
      setForm({ name: '', code: '', description: '' });
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Departments</h1>
          <p className="text-xs text-slate-400 mt-1">
            Organizational cost centers and cross-functional teams
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add Department</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      <Table
        columns={['Department Name', 'Description', 'Employees']}
        rows={departments.map((d) => [
          <span key="n" className="font-semibold text-white flex items-center gap-2">
            <Building2 size={15} className="text-[#00df82]" /> {d.name}
          </span>,
          d.description,
          <span key="m" className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-[#00df82] text-xs font-bold">
            {d.memberCount ?? 0} staff
          </span>,
        ])}
      />

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Create Department</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={create} className="space-y-3.5 text-sm">
              <input
                required
                placeholder="Department Code (e.g. QA)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                placeholder="Department Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
