'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function DepartmentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setRows(await api('/departments'));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/departments', {
        method: 'POST',
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setName('');
      setDescription('');
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Engineering &amp; Operations Departments</h1>
        <p className="text-sm text-slate-400 mb-6">Organizational units and active headcount breakdown</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">{error}</div>
        )}

        <form onSubmit={create} className="flex flex-wrap gap-2 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Mandate / scope" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm">
            + Create Department
          </button>
        </form>

        <Table
          columns={['Department', 'Mandate', 'Assigned Staff', 'Created']}
          rows={rows.map((d) => [
            <span key="n" className="font-semibold text-white">{d.name}</span>,
            d.description ?? '—',
            `${d.memberCount ?? 0} members`,
            new Date(d.createdAt).toLocaleDateString(),
          ])}
        />
      </main>
    </div>
  );
}
