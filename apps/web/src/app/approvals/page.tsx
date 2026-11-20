'use client';
import React, { useEffect, useState } from 'react';
import { Check, GitBranch, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Table from '@/components/Table';
import { api } from '@/lib/api';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [error, setError] = useState('');

  const load = () =>
    api('/approvals')
      .then(setApprovals)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, status: 'APPROVED' | 'REJECTED') {
    setError('');
    try {
      await api(`/approvals/${id}/decide`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision: status,
          comment: `${status} via OpsPilot Workflow Console`,
        }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workflow &amp; Approvals</h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-stage authorization queue for high-value Purchase Orders and Urgent Work Orders
          </p>
        </div>

        <span className="px-3.5 py-2 rounded-xl ops-card text-xs font-bold text-[#00df82] flex items-center gap-2">
          <GitBranch size={15} />
          <span>{pendingCount} Pending Decision(s)</span>
        </span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      <Table
        columns={['Type', 'Subject', 'Amount (Rs.)', 'Requested By', 'Status', 'Decision']}
        rows={approvals.map((a) => {
          const stCls =
            a.status === 'APPROVED'
              ? 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30'
              : a.status === 'REJECTED'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
          return [
            <span key="t" className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.05] text-slate-300">
              {a.type}
            </span>,
            <div key="s">
              <p className="font-semibold text-white">{a.title}</p>
              {a.comment && <p className="text-[11px] text-slate-500 mt-0.5">{a.comment}</p>}
            </div>,
            a.amount ? `Rs. ${Number(a.amount).toLocaleString()}` : '—',
            a.requester ? `${a.requester.firstName} ${a.requester.lastName}` : '—',
            <span key="st" className={`px-3 py-1 rounded-full text-xs font-semibold border ${stCls}`}>
              {a.status}
            </span>,
            a.status === 'PENDING' ? (
              <div key="d" className="flex items-center gap-2">
                <button
                  onClick={() => decide(a.id, 'APPROVED')}
                  className="px-3 py-1.5 rounded-xl ops-btn-primary text-xs font-bold inline-flex items-center gap-1"
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  onClick={() => decide(a.id, 'REJECTED')}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <X size={13} /> Reject
                </button>
              </div>
            ) : (
              <span key="done" className="text-xs text-slate-400">
                {a.approver ? `By ${a.approver.firstName}` : 'Finalized'}
              </span>
            ),
          ];
        })}
      />
    </AppShell>
  );
}
