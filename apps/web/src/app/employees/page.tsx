'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import { api } from '@/lib/api';

const PAGE_SIZE = 6;

export default function EmployeesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: 'Password123!',
    firstName: '',
    lastName: '',
    role: 'EMPLOYEE',
    jobTitle: '',
    departmentId: '',
  });

  const load = () =>
    Promise.all([api('/users'), api('/departments')])
      .then(([u, d]) => {
        setUsers(u);
        setDepartments(d);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({ ...form, departmentId: form.departmentId || undefined }),
      });
      setShowAdd(false);
      setForm({
        email: '',
        password: 'Password123!',
        firstName: '',
        lastName: '',
        role: 'EMPLOYEE',
        jobTitle: '',
        departmentId: '',
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setError('');
    try {
      await api(`/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: editUser.role, status: editUser.status }),
      });
      setEditUser(null);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggleStatus(u: any) {
    setError('');
    try {
      const nextStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await api(`/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: u.role, status: nextStatus }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const filtered = users.filter((u) => {
    const full = `${u.firstName} ${u.lastName} ${u.email} ${u.jobTitle || ''}`.toLowerCase();
    if (search.trim() && !full.includes(search.toLowerCase())) return false;
    if (deptFilter !== 'ALL' && (u.department?.name || '') !== deptFilter) return false;
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Employee Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory, department assignments, and role-based access governance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/departments"
            className="px-3.5 py-2.5 rounded-xl ops-card text-xs font-semibold text-slate-200 hover:border-emerald-500/40 flex items-center gap-2"
          >
            <Building2 size={15} className="text-[#00df82]" />
            <span>Departments ({departments.length})</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Search & Filter Bar matching Reference */}
      <div className="ops-card rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl ops-input text-sm placeholder:text-slate-500"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2.5 rounded-xl ops-input text-xs font-medium cursor-pointer"
        >
          <option value="ALL">Department: All</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              Department: {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2.5 rounded-xl ops-input text-xs font-medium cursor-pointer"
        >
          <option value="ALL">Status: All</option>
          <option value="ACTIVE">Status: Active</option>
          <option value="SUSPENDED">Status: Suspended</option>
        </select>
      </div>

      {/* Employees Data Table Card */}
      <div className="ops-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-semibold text-slate-400">
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => {
                const fullName = `${u.firstName} ${u.lastName}`;
                const active = u.status === 'ACTIVE';
                return (
                  <tr
                    key={u.id}
                    className="border-b last:border-b-0 border-white/[0.045] hover:bg-emerald-500/[0.04] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName} size={38} online={active} />
                        <div>
                          <p className="font-semibold text-white leading-tight">{fullName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-200 font-medium">
                      {u.department?.name || 'Operations'}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-100 font-medium">{u.jobTitle || u.role}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{u.role}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          active
                            ? 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditUser({ ...u })}
                          className="h-8 w-8 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/25 text-sky-400 flex items-center justify-center transition-colors"
                          title="Edit Role & Access"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(u)}
                          className="h-8 w-8 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-rose-400 flex items-center justify-center transition-colors"
                          title={active ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500 text-xs">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching Reference */}
        <div className="px-5 py-3.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} employees
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`h-8 w-8 rounded-lg font-bold transition-all ${
                  pNum === safePage
                    ? 'ops-btn-primary'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300'
                }`}
              >
                {pNum}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add New Employee</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createEmployee} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <input
                required
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                type="email"
                placeholder="Work Email (e.g. kasun@company.lk)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                placeholder="Job Title (e.g. Software Engineer)"
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              >
                {['EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN', 'VIEWER'].map((r) => (
                  <option key={r} value={r}>
                    RBAC Role: {r}
                  </option>
                ))}
              </select>
              <input
                required
                minLength={8}
                type="password"
                placeholder="Initial Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl ops-input"
              />
              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Role/Status Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Edit Access · {editUser.firstName} {editUser.lastName}
              </h2>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">RBAC Role</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                >
                  {['COMPANY_ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Account Status</label>
                <select
                  value={editUser.status}
                  onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
