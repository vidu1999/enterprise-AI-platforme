'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  ChevronDown,
  Cpu,
  GitBranch,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { API_BASE, api, getUser, logout } from '@/lib/api';
import OpsLogo from './OpsLogo';
import Avatar from './Avatar';
import GlobalAiCopilot from './GlobalAiCopilot';

const MAIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: ['/dashboard'] },
  { href: '/employees', label: 'Employees', icon: Users, match: ['/employees', '/departments'] },
  { href: '/inventory', label: 'Inventory', icon: Package, match: ['/inventory'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, match: ['/maintenance', '/assets'] },
  { href: '/purchase-orders', label: 'Purchasing', icon: ShoppingCart, match: ['/purchase-orders', '/suppliers'] },
  { href: '/approvals', label: 'Workflow', icon: GitBranch, match: ['/approvals'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, match: ['/reports'] },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot, match: ['/ai-assistant'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, match: ['/notifications'], badge: true },
  { href: '/settings', label: 'Settings', icon: Settings, match: ['/settings', '/audit'] },
];

const QUICK_ROUTES = [
  { label: 'Dashboard Overview', href: '/dashboard', tag: 'Analytics' },
  { label: 'Employees Directory', href: '/employees', tag: 'HR' },
  { label: 'Departments', href: '/departments', tag: 'HR' },
  { label: 'Inventory & Stock Control', href: '/inventory', tag: 'Supply Chain' },
  { label: 'Suppliers & Vendors', href: '/suppliers', tag: 'Purchasing' },
  { label: 'Purchase Orders', href: '/purchase-orders', tag: 'Purchasing' },
  { label: 'Maintenance Work Orders', href: '/maintenance', tag: 'Operations' },
  { label: 'Machines & Equipment Assets', href: '/assets', tag: 'Operations' },
  { label: 'Workflow Approvals Queue', href: '/approvals', tag: 'Workflow' },
  { label: 'Reports & Analytics', href: '/reports', tag: 'BI' },
  { label: 'AI Business Assistant', href: '/ai-assistant', tag: 'AI / RAG' },
  { label: 'Security Audit Trail', href: '/audit', tag: 'Governance' },
  { label: 'Company & System Settings', href: '/settings', tag: 'System' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u) return;

    api('/notifications/unread-count')
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => undefined);

    const wsBase = API_BASE || undefined;
    const socket = io(wsBase, { path: '/socket.io', transports: ['websocket', 'polling'] });
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : user?.email?.split('@')[0] || 'Vidura Kavinda';
  const displayRole =
    user?.jobTitle ||
    (user?.role === 'COMPANY_ADMIN'
      ? 'Administrator'
      : user?.role === 'MANAGER'
        ? 'Operations Manager'
        : user?.role || 'Administrator');

  const filteredRoutes = QUICK_ROUTES.filter(
    (r) =>
      !searchQuery.trim() ||
      r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
      {MAIN_NAV.map((item) => {
        const Icon = item.icon;
        const active = item.match.includes(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
              active
                ? 'ops-nav-active'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                size={18}
                className={
                  active ? 'text-[#00df82] drop-shadow-[0_0_8px_rgba(0,223,130,0.6)]' : 'text-slate-400 group-hover:text-slate-200'
                }
              />
              <span>{item.label}</span>
            </span>
            {item.badge && unread > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen ops-aurora-canvas flex text-slate-100 relative">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col bg-[#08101c]/85 backdrop-blur-2xl border-r border-white/[0.06] sticky top-0 h-screen z-30">
        <div className="px-5 pt-6 pb-5">
          <Link href="/dashboard">
            <OpsLogo size="md" />
          </Link>
        </div>

        {renderNavLinks()}

        {/* Subtle Secondary Quick Links Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <Link
              href="/assets"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]"
            >
              <Cpu size={13} /> Equipment
            </Link>
            <Link
              href="/suppliers"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]"
            >
              <Truck size={13} /> Suppliers
            </Link>
            <Link
              href="/departments"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]"
            >
              <Building2 size={13} /> Depts
            </Link>
            <Link
              href="/audit"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]"
            >
              <ShieldCheck size={13} /> Audit Log
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 max-w-[80vw] bg-[#08101c] border-r border-white/10 flex flex-col z-10">
            <div className="px-5 py-5 flex items-center justify-between border-b border-white/[0.06]">
              <OpsLogo size="sm" />
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            {renderNavLinks(() => setMobileMenuOpen(false))}
            <div className="p-4 border-t border-white/[0.06]">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Global Header Bar matching Reference */}
        <header className="h-[70px] px-4 md:px-8 flex items-center justify-between gap-4 border-b border-white/[0.05] bg-[#08101c]/55 backdrop-blur-xl sticky top-0 z-20">
          {/* Mobile Hamburger + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200"
            >
              <Menu size={18} />
            </button>
            <OpsLogo size="sm" />
          </div>

          {/* Global Search Input (Ctrl + K) */}
          <div className="hidden md:block relative w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search anything... (Ctrl + K)"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0e1a2b]/90 border border-white/[0.07] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            {searchOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
                <div className="absolute left-0 right-0 mt-2 rounded-2xl ops-card p-2 z-30 max-h-72 overflow-y-auto border border-emerald-500/25">
                  {filteredRoutes.map((r) => (
                    <button
                      key={r.href}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        router.push(r.href);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs hover:bg-emerald-500/15 transition-colors"
                    >
                      <span className="font-medium text-slate-100">{r.label}</span>
                      <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] text-emerald-300">{r.tag}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Header Icons & Profile */}
          <div className="flex items-center gap-3 md:gap-4 ml-auto">
            <Link
              href="/notifications"
              className="relative p-2.5 rounded-xl bg-[#0e1a2b]/80 hover:bg-[#132338] border border-white/[0.07] text-slate-300 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[#08101c]" />
              )}
            </Link>

            <Link
              href="/settings"
              className="hidden sm:inline-flex p-2.5 rounded-xl bg-[#0e1a2b]/80 hover:bg-[#132338] border border-white/[0.07] text-slate-300 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings size={17} />
            </Link>

            {/* User Profile Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-white/[0.04] transition-colors"
              >
                <Avatar name={displayName} size={36} />
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-[13px] font-semibold text-white">{displayName}</p>
                  <p className="text-[11px] text-slate-400">{displayRole}</p>
                </div>
                <ChevronDown size={14} className="hidden sm:block text-slate-400" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl ops-card border border-white/10 p-2 z-30 shadow-2xl">
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <p className="text-xs font-bold text-white truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@demo.local'}</p>
                      {user?.companyName && (
                        <p className="text-[10px] text-emerald-400 font-medium mt-0.5 truncate">{user.companyName}</p>
                      )}
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.06]"
                    >
                      <Settings size={14} className="text-emerald-400" /> System Settings
                    </Link>
                    <Link
                      href="/audit"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.06]"
                    >
                      <ShieldCheck size={14} className="text-emerald-400" /> Security Audit Logs
                    </Link>
                    <a
                      href="/docs"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.06]"
                    >
                      <BarChart3 size={14} className="text-emerald-400" /> OpenAPI / Swagger Docs ↗
                    </a>
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 mt-1 border-t border-white/[0.06]"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Live Real-Time Socket.IO Toast */}
        {liveToast && (
          <div className="fixed bottom-20 md:bottom-6 right-6 z-50 max-w-sm ops-card ops-card-glow rounded-2xl p-4">
            <p className="text-xs font-bold text-emerald-400">{liveToast.title}</p>
            <p className="text-xs text-slate-200 mt-1">{liveToast.message}</p>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>

      {/* Global Floating AI Copilot Orb & Auto-Navigation Arrival Guide */}
      <GlobalAiCopilot />

      {/* Mobile Bottom Tab Bar matching Reference Phone View */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#08101c]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around z-30">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            pathname === '/dashboard' ? 'text-[#00df82]' : 'text-slate-400'
          }`}
        >
          <Home size={19} />
          <span>Home</span>
        </Link>
        <Link
          href="/notifications"
          className={`relative flex flex-col items-center gap-1 text-[11px] font-medium ${
            pathname === '/notifications' ? 'text-[#00df82]' : 'text-slate-400'
          }`}
        >
          <Bell size={19} />
          {unread > 0 && <span className="absolute top-0 right-2 h-2 w-2 rounded-full bg-rose-500" />}
          <span>Notifications</span>
        </Link>
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
            pathname === '/settings' ? 'text-[#00df82]' : 'text-slate-400'
          }`}
        >
          <User size={19} />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
