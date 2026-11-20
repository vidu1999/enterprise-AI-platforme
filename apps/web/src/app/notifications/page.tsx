'use client';
import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);

  const load = () =>
    api('/notifications')
      .then(setItems)
      .catch(() => undefined);

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await api('/notifications/read-all', { method: 'PATCH' });
    load();
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Socket.IO workflow alerts, low-stock warnings, and approval updates
          </p>
        </div>

        <button
          type="button"
          onClick={markAll}
          className="px-4 py-2.5 rounded-xl ops-card text-xs font-semibold text-slate-200 hover:border-emerald-500/40 flex items-center gap-2"
        >
          <CheckCheck size={15} className="text-[#00df82]" />
          <span>Mark All as Read</span>
        </button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`ops-card rounded-2xl p-4 flex items-start justify-between gap-4 ${
              !n.read ? 'ops-card-glow' : ''
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !n.read ? 'bg-emerald-500/15 text-[#00df82]' : 'bg-white/[0.04] text-slate-400'
                }`}
              >
                <Bell size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">{n.title}</p>
                  {!n.read && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00df82] text-[10px] font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">{n.message}</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              {new Date(n.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="ops-card rounded-2xl p-12 text-center text-xs text-slate-500">
            No notifications yet.
          </div>
        )}
      </div>
    </AppShell>
  );
}
