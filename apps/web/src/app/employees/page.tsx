'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function EmployeesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'EMPLOYEE',
    departmentId: '',
    jobTitle: '',
  });

  async function load() {
    setError('');
    try {
      const [u, d] = await Promise.all([api('/users'), api('/departments')]);
      setRows(u);
      setDepts(d);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          departmentId: form.departmentId || undefined,
          jobTitle: form.jobTitle || undefined,
        }),
      });
      setForm({ email: '', firstName: '', lastName: '', password: '', role: 'EMPLOYEE', departmentId: '', jobTitle: '' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Employees &amp; RBAC Directory</h1>
        <p className="text-sm text-slate-400 mb-6">
          Manage engineering staff, departmental assignments, and role-based permissions
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={create} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" placeholder="Job Title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
          <select className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">Department…</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="MANAGER">MANAGER</option>
            <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <button className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm">
            + Add Employee
          </button>
        </form>

        <Table
          columns={['Employee', 'Job Title', 'Department', 'Email', 'RBAC Role', 'Status']}
          rows={rows.map((u) => [
            <span key="n" className="font-medium text-white">{u.firstName} {u.lastName}</span>,
            u.jobTitle ?? '—',
            u.department?.name ?? 'Unassigned',
            <span key="e" className="font-mono text-xs text-slate-300">{u.email}</span>,
            <span key="r" className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/15 text-sky-300">
              {u.role}
            </span>,
            <span key="s" className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300">
              {u.status}
            </span>,
          ])}
        />
      </main>
    </div>
  );
}
