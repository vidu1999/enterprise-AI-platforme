'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronDown,
  Package,
  Plus,
  ShoppingCart,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api, getUser } from '@/lib/api';

const DEPT_COLORS = ['#00df82', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6'];

function formatLkrCompact(val: number): string {
  if (val >= 1_000_000) return `Rs. ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `Rs. ${Math.round(val / 1_000)}K`;
  return `Rs. ${val.toLocaleString()}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState('Last 30 Days');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);
    api('/analytics/dashboard')
      .then(setData)
      .catch(() => router.push('/login'));
  }, [router]);

  const firstName = user?.firstName || 'Vidura';
  const kpis = data?.kpis;

  return (
    <AppShell>
      {/* Mobile Greeting Banner matching Reference Phone View */}
      <div className="md:hidden mb-5">
        <h1 className="text-xl font-bold text-white">Good Morning, {firstName} 👋</h1>
        <p className="text-xs text-slate-400 mt-0.5">Here&apos;s what&apos;s happening today</p>
      </div>

      {/* Desktop Header Row */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        </div>
        <div className="relative inline-flex items-center">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 rounded-xl ops-card text-xs font-semibold text-slate-200 border border-white/10 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
            <option value="This Year">This Year</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {!data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-2xl ops-card animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* 4 Signature KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {/* Total Employees */}
            <div className="ops-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Total Employees</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                    {kpis.employees.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-[#00df82]">
                  <Users size={19} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-[#00df82] flex items-center gap-1">
                <ArrowUpRight size={13} />
                <span>+8% from last month</span>
              </p>
            </div>

            {/* Total Inventory */}
            <div className="ops-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Total Inventory</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                    {(kpis.totalUnits || kpis.inventoryItems).toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400">
                  <Package size={19} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>{kpis.lowStockItems} low stock items</span>
              </p>
            </div>

            {/* Pending Work Orders */}
            <div className="ops-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Pending Work Orders</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{kpis.openWorkOrders}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-400">
                  <Wrench size={19} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-rose-400">
                {Math.max(1, kpis.overdueWorkOrders)} urgent / overdue tasks
              </p>
            </div>

            {/* Monthly Purchases */}
            <div className="ops-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Monthly Purchases</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                    {formatLkrCompact(kpis.monthlyPurchases || 2_400_000)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-[#00df82]">
                  <Banknote size={19} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-[#00df82] flex items-center gap-1">
                <ArrowUpRight size={13} />
                <span>+12% this month</span>
              </p>
            </div>
          </div>

          {/* Mobile Quick Actions Strip matching Reference Phone View */}
          <div className="md:hidden mb-6">
            <p className="text-xs font-semibold text-slate-300 mb-2.5">Quick Actions</p>
            <div className="grid grid-cols-3 gap-2.5">
              <Link
                href="/maintenance"
                className="ops-btn-primary rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1 text-xs font-bold"
              >
                <Plus size={16} />
                <span>+ New Order</span>
              </Link>
              <Link
                href="/inventory"
                className="ops-card rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-200"
              >
                <Package size={16} className="text-sky-400" />
                <span>Add Stock</span>
              </Link>
              <Link
                href="/purchase-orders"
                className="ops-card rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-200"
              >
                <ShoppingCart size={16} className="text-emerald-400" />
                <span>Create PO</span>
              </Link>
            </div>
          </div>

          {/* Primary Analytics Row: Business Performance + Department Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* Business Performance Area Chart */}
            <div className="lg:col-span-7 ops-card rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <h2 className="text-base font-bold text-white">Business Performance</h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00df82]" /> This Month
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Last Month
                  </span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.businessPerformance || []}>
                    <defs>
                      <linearGradient id="perfEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00df82" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="#00df82" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0b1626',
                        border: '1px solid rgba(0,223,130,0.28)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="lastMonth"
                      name="Last Month"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={0}
                    />
                    <Area
                      type="monotone"
                      dataKey="thisMonth"
                      name="This Month"
                      stroke="#00df82"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#perfEmerald)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Overview Donut Chart */}
            <div className="lg:col-span-5 ops-card rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white">Department Overview</h2>
                <Link href="/departments" className="text-xs text-[#00df82] hover:underline">
                  Manage →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 my-auto">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.departmentOverview || []}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {(data.departmentOverview || []).map((_: any, i: number) => (
                          <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#0b1626',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {(data.departmentOverview || []).slice(0, 5).map((dept: any, idx: number) => (
                    <div key={dept.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-300">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: DEPT_COLORS[idx % DEPT_COLORS.length] }}
                        />
                        <span>{dept.name}</span>
                      </span>
                      <span className="font-bold text-white">{dept.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Top Equipment Cost Breakdown + Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Equipment Maintenance Cost Bar Chart */}
            <div className="lg:col-span-7 ops-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Maintenance Spend by Equipment (Rs.)</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Live telemetry aggregated from active & completed work orders</p>
                </div>
                <Link href="/ai-assistant" className="text-xs font-semibold text-[#00df82] hover:underline">
                  Ask AI Copilot →
                </Link>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.costsByAsset || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Spend']}
                      contentStyle={{
                        background: '#0b1626',
                        border: '1px solid rgba(0,223,130,0.28)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="cost" fill="#00df82" radius={[8, 8, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activities Feed matching Reference */}
            <div className="lg:col-span-5 ops-card rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Recent Activities</h2>
                <Link href="/audit" className="text-xs text-slate-400 hover:text-[#00df82]">
                  View Audit Trail →
                </Link>
              </div>

              <div className="space-y-3.5 my-auto">
                {(data.recentActivities || []).map((act: any) => {
                  const iconMap: Record<string, { icon: any; cls: string }> = {
                    work_order: { icon: Wrench, cls: 'bg-amber-500/15 text-amber-400 border-amber-400/25' },
                    purchase_order: {
                      icon: CheckCircle2,
                      cls: 'bg-emerald-500/15 text-[#00df82] border-emerald-400/25',
                    },
                    employee: { icon: UserPlus, cls: 'bg-sky-500/15 text-sky-400 border-sky-400/25' },
                    inventory: { icon: Package, cls: 'bg-purple-500/15 text-purple-400 border-purple-400/25' },
                  };
                  const cfg = iconMap[act.kind] || iconMap.work_order;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${cfg.cls}`}>
                          <Icon size={16} />
                        </div>
                        <p className="text-xs font-medium text-slate-200 truncate">{act.title}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">{act.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
