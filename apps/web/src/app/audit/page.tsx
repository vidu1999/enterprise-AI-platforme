'use client';
import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Table from '@/components/Table';
import { api } from '@/lib/api';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/audit')
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable append-only ledger of state mutations across your organization
          </p>
        </div>

        <span className="px-3.5 py-2 rounded-xl ops-card text-xs font-bold text-[#00df82] flex items-center gap-2">
          <ShieldCheck size={15} />
          <span>{logs.length} Verified Event(s)</span>
        </span>
      </div>

      {error ? (
        <div className="ops-card rounded-2xl p-6 text-sm text-amber-300 border border-amber-500/30">
          RBAC Restriction: {error} — Audit trail inspection requires COMPANY_ADMIN or MANAGER privileges.
        </div>
      ) : (
        <Table
          columns={['Timestamp', 'Actor', 'Action', 'Entity', 'Metadata']}
          rows={logs.map((l) => [
            <span key="t" className="text-xs text-slate-400 whitespace-nowrap">
              {new Date(l.createdAt).toLocaleString()}
            </span>,
            l.actor ? `${l.actor.name} (${l.actor.role})` : 'System',
            <span key="a" className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-[#00df82] font-bold">
              {l.action}
            </span>,
            `${l.entity} ${l.entityId ? `· ${l.entityId.slice(0, 8)}` : ''}`,
            <code key="m" className="text-[11px] text-slate-400">
              {l.details ? JSON.stringify(l.details) : '—'}
            </code>,
          ])}
        />
      )}
    </AppShell>
  );
}
