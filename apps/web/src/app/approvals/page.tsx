'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function ApprovalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setRows(await api('/approvals'));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function decide(id: string, decision: 'APPROVED' | 'REJECTED') {
    setError('');
    try {
      await api(`/approvals/${id}/decide`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, comment: `${decision} via Approvals Console` }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Workflow Approvals Queue</h1>
        <p className="text-sm text-slate-400 mb-6">
          Role-gated manager &amp; company-admin sign-off for purchase orders and operational workflows
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">
            {error}
          </div>
        )}

        <Table
          columns={['Request Title', 'Type', 'Amount (LKR)', 'Requested By', 'Status', 'Decision']}
          rows={rows.map((a) => [
            <div key="t">
              <p className="font-medium text-white">{a.title}</p>
              <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
            </div>,
            <span key="ty" className="text-xs font-mono text-slate-300">{a.type}</span>,
            Number(a.amount ?? 0).toLocaleString(),
            a.requestedBy ?? 'System Automation',
            <span
              key="st"
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                a.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : a.status === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {a.status}
            </span>,
            a.status === 'PENDING' ? (
              <div key="dec" className="flex gap-2">
                <button
                  onClick={() => decide(a.id, 'APPROVED')}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(a.id, 'REJECTED')}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Reject
                </button>
              </div>
            ) : (
              <span key="by" className="text-xs text-slate-400">
                {a.approvedBy ? `By ${a.approvedBy}` : 'Decided'}
              </span>
            ),
          ])}
        />
      </main>
    </div>
  );
}
