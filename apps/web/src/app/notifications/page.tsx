'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function NotificationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [outbox, setOutbox] = useState<any[]>([]);

  async function load() {
    const [n, o] = await Promise.all([
      api('/notifications'),
      api('/notifications/email-outbox').catch(() => []),
    ]);
    setRows(n);
    setOutbox(o);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function read(id: string) {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
    load();
  }

  async function readAll() {
    await api('/notifications/read-all', { method: 'PATCH' });
    load();
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Real-Time &amp; Email Notifications</h1>
            <p className="text-sm text-slate-400">
              Socket.IO live push alerts + transactional email dispatch status
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium"
            onClick={readAll}
          >
            Mark all read
          </button>
        </div>

        <div className="space-y-3 mb-10">
          {rows.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                n.read ? 'border-slate-800 bg-slate-900/40' : 'border-sky-600/60 bg-sky-950/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{n.title}</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-sky-300">
                    {n.type}
                  </span>
                  {n.emailStatus && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-300">
                      Email: {n.emailStatus}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 mt-1">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && (
                <button
                  className="px-3 py-1 rounded-lg bg-sky-500/20 text-xs font-semibold text-sky-300 shrink-0"
                  onClick={() => read(n.id)}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-slate-500">Your notification inbox is clear.</p>}
        </div>

        {outbox.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Recent Outbound Transactional Emails (Admin/Manager View)
            </h2>
            <div className="space-y-2">
              {outbox.slice(0, 8).map((e) => (
                <div key={e.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex justify-between">
                  <div>
                    <span className="font-mono text-sky-400">{e.to}</span> — <span className="font-semibold text-slate-200">{e.subject}</span>
                    <p className="text-slate-400 mt-0.5">{e.body}</p>
                  </div>
                  <span className="text-slate-500 shrink-0">{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
