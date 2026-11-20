'use client';
import React, { useEffect, useState } from 'react';
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
import { FileSpreadsheet } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

const MONTHLY_PERF = [
  { month: 'Jan', score: 185000, maint: 92000 },
  { month: 'Feb', score: 210000, maint: 118000 },
  { month: 'Mar', score: 245000, maint: 104000 },
  { month: 'Apr', score: 232000, maint: 139000 },
  { month: 'May', score: 289000, maint: 126000 },
  { month: 'Jun', score: 342000, maint: 158000 },
];

const REQUEST_COLORS = ['#00df82', '#3b82f6', '#f59e0b'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'Overview' | 'Inventory' | 'Maintenance' | 'Financial'>('Overview');
  const [toast, setToast] = useState('');

  useEffect(() => {
    api('/analytics/dashboard')
      .then(setData)
      .catch(() => undefined);
  }, []);

  function generateReport() {
    const payload = {
      generatedAt: new Date().toISOString(),
      reportType: tab,
      organization: 'OpsPilot (Pvt) Ltd',
      kpis: data?.kpis ?? {},
      topProducts: data?.topProducts ?? [],
      costsByAsset: data?.costsByAsset ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opspilot-${tab.toLowerCase()}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`${tab} executive report exported.`);
    setTimeout(() => setToast(''), 3500);
  }

  const topProducts =
    data?.topProducts && data.topProducts.length > 0
      ? data.topProducts
      : [
          { name: 'Laptop Dell XPS', percentage: 42 },
          { name: 'Monitor LG 27"', percentage: 28 },
          { name: 'Wireless Mouse', percentage: 18 },
          { name: 'Printer HP Laser', percentage: 12 },
        ];

  const requestRing = [
    { name: 'Completed', value: Math.max(12, (data?.kpis?.completedWorkOrders || 3) * 180) },
    { name: 'In Progress', value: Math.max(8, (data?.kpis?.inProgressWorkOrders || 2) * 145) },
    { name: 'Pending', value: Math.max(5, (data?.kpis?.openWorkOrders || 3) * 95) },
  ];
  const totalRequests = 1248 + (data?.kpis?.totalWorkOrders || 0);

  return (
    <AppShell>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reports &amp; Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cross-departmental operational KPIs, inventory velocity, and maintenance expenditure trends
          </p>
        </div>

        <button
          type="button"
          onClick={generateReport}
          className="px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold flex items-center gap-2"
        >
          <FileSpreadsheet size={16} />
          <span>Generate Report</span>
        </button>
      </div>

      {toast && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-200">
          {toast}
        </div>
      )}

      {/* Underline Category Tabs matching Reference */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-6 overflow-x-auto">
        {(['Overview', 'Inventory', 'Maintenance', 'Financial'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === t ? 'border-[#00df82] text-[#00df82]' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 2x2 Analytics Grid matching Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Monthly Performance */}
        <div className="ops-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Monthly Performance</h2>
              <p className="text-xs text-slate-400 mt-0.5">{tab} operational throughput index</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-[#00df82] text-[11px] font-bold">
              +18.4% YoY
            </span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_PERF}>
                <defs>
                  <linearGradient id="repEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00df82" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#00df82" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, 'Throughput']}
                  contentStyle={{
                    background: '#0b1626',
                    border: '1px solid rgba(0,223,130,0.28)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#00df82"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#repEmerald)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Top Products Horizontal Progress Bars */}
        <div className="ops-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Top Products</h2>
            <p className="text-xs text-slate-400 mt-0.5">Share of active inventory valuation</p>
          </div>

          <div className="space-y-4 my-auto py-4">
            {topProducts.slice(0, 4).map((prod: any, i: number) => {
              const colors = ['#00df82', '#3b82f6', '#10b981', '#8b5cf6'];
              return (
                <div key={prod.name}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{prod.name}</span>
                    <span className="font-bold text-white">{prod.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, prod.percentage)}%`,
                        background: colors[i % colors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Maintenance Cost Bar Chart */}
        <div className="ops-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Maintenance Cost</h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly preventive &amp; corrective spend (Rs.)</p>
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_PERF}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, 'Maintenance']}
                  contentStyle={{
                    background: '#0b1626',
                    border: '1px solid rgba(0,223,130,0.28)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="maint" fill="#00df82" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Total Requests Donut Ring */}
        <div className="ops-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Total Requests</h2>
            <p className="text-xs text-slate-400 mt-0.5">Cumulative workflow, PO &amp; service dispatches</p>
          </div>

          <div className="relative h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={requestRing}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={88}
                  paddingAngle={4}
                  stroke="none"
                >
                  {requestRing.map((_, idx) => (
                    <Cell key={idx} fill={REQUEST_COLORS[idx % REQUEST_COLORS.length]} />
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-white">{totalRequests.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Total Requests</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 text-xs">
            {requestRing.map((r, i) => (
              <span key={r.name} className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: REQUEST_COLORS[i] }} />
                {r.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
