'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { io } from 'socket.io-client';
import { api, getUser, logout } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Executive Dashboard', group: 'Overview' },
  { href: '/ai-assistant', label: 'AI Operations Assistant', group: 'Overview' },
  { href: '/maintenance', label: 'Work Orders', group: 'Operations' },
  { href: '/assets', label: 'Machines & Assets', group: 'Operations' },
  { href: '/inventory', label: 'MRO Inventory', group: 'Supply Chain' },
  { href: '/suppliers', label: 'Suppliers', group: 'Supply Chain' },
  { href: '/purchase-orders', label: 'Purchase Orders', group: 'Supply Chain' },
  { href: '/approvals', label: 'Approvals Queue', group: 'Workflow' },
  { href: '/notifications', label: 'Notifications', group: 'Workflow', badge: true },
  { href: '/employees', label: 'Employees (HR)', group: 'Organization' },
  { href: '/departments', label: 'Departments', group: 'Organization' },
  { href: '/audit', label: 'Security Audit Trail', group: 'Governance' },
  { href: '/settings', label: 'Tenant Settings', group: 'Governance' },
];

export default function Sidebar() {
  const path = usePathname();
  const [user, setUser] = useState<any>(null);
  const [unread, setUnread] = useState<number>(0);
  const [liveToast, setLiveToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u) return;

    api('/notifications/unread-count')
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => undefined);

    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket.emit('join', { userId: u.id, companyId: u.companyId });
    });
    socket.on('notification', (payload: any) => {
      setUnread((n) => n + 1);
      setLiveToast({ title: payload.title, message: payload.message });
      setTimeout(() => setLiveToast(null), 5000);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <aside className="w-64 min-h-screen bg-slate-950 border-r border-slate-800/90 p-4 flex flex-col shrink-0">
      <div className="mb-5 px-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-slate-950 font-black text-sm">
            OP
          </span>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">OpsPilot</span>
            <p className="text-[11px] text-slate-400 leading-tight">Enterprise Operations AI</p>
          </div>
        </Link>
        {user?.companyName && (
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 truncate">
            {user.companyName}
          </div>
        )}
      </div>

      {liveToast && (
        <div className="mb-3 p-2.5 rounded-lg bg-sky-950/90 border border-sky-600/60 text-xs">
          <p className="font-semibold text-sky-300">{liveToast.title}</p>
          <p className="text-slate-300 mt-0.5 line-clamp-2">{liveToast.message}</p>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV.map((n) => {
          const active = path === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-sky-500/15 text-sky-300 font-medium border border-sky-500/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span>{n.label}</span>
              {n.badge && unread > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-sky-500 text-slate-950">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-sky-300 hover:bg-slate-900"
        >
          OpenAPI / Swagger Docs ↗
        </a>
        {user && (
          <div className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300">
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
