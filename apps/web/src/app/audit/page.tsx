'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/audit')
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-1">Immutable Security Audit Trail</h1>
        <p className="text-sm text-slate-400 mb-6">
          Tracks who mutated what, when, and from which IP (passwords &amp; tokens automatically redacted)
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">
            {error}
          </div>
        )}

        <Table
          columns={['Timestamp', 'Actor', 'Role', 'Method / Action', 'Route / Entity', 'IP', 'Details']}
          rows={rows.map((a) => [
            new Date(a.createdAt).toLocaleString(),
            a.actor ? `${a.actor.name || a.actor.email}` : 'System',
            a.actor?.role ? (
              <span key="r" className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-sky-300">
                {a.actor.role}
              </span>
            ) : (
              '—'
            ),
            <span key="ac" className="font-mono text-xs font-bold text-amber-300">{a.action}</span>,
            <span key="en" className="font-mono text-xs text-slate-300">{a.entity}</span>,
            a.ipAddress ?? '—',
            <span key="dt" className="font-mono text-[11px] text-slate-400 max-w-xs truncate block">
              {a.details ? JSON.stringify(a.details) : '—'}
            </span>,
          ])}
        />
      </main>
    </div>
  );
}
