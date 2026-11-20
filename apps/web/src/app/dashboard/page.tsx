'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/analytics/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const statusChart = data
    ? Object.entries(data.workOrdersByStatus || {}).map(([status, count]) => ({ status, count }))
    : [];
  const costChart = data?.costsByAsset ?? [];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Executive Operations Dashboard</h1>
            <p className="text-sm text-slate-400">
              Real-time plant reliability, MRO inventory valuation, and approval queue health
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/ai-assistant"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm"
            >
              Ask AI Assistant →
            </Link>
            <Link
              href="/approvals"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm"
            >
              Review Approvals
            </Link>
          </div>
        </div>

        {error && <p className="text-rose-400 mb-4">{error}</p>}
        {!data && !error && <p className="text-slate-400">Loading operational telemetry…</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                ['Employees & Staff', data.kpis.employees, `${data.kpis.departments ?? 0} departments`],
                ['Industrial Assets', data.kpis.assets, 'Tracked machines & utilities'],
                ['Active Work Orders', data.kpis.openWorkOrders, `${data.kpis.completedWorkOrders} completed`],
                [
                  'Low-Stock Alerts',
                  data.kpis.lowStockItems,
                  `of ${data.kpis.inventoryItems} MRO SKUs`,
                  data.kpis.lowStockItems > 0 ? 'text-amber-400' : 'text-emerald-400',
                ],
                [
                  'Pending Approvals',
                  data.kpis.pendingApprovals,
                  'Procurement & workflow queue',
                  data.kpis.pendingApprovals > 0 ? 'text-sky-400' : 'text-slate-200',
                ],
                [
                  'Inventory Valuation',
                  `LKR ${Number(data.kpis.totalInventoryValue ?? 0).toLocaleString()}`,
                  `${data.kpis.totalUnits} total units on hand`,
                ],
                [
                  'Actual Maint. Spend',
                  `LKR ${Number(data.maintenanceCosts.actual ?? 0).toLocaleString()}`,
                  `Est: LKR ${Number(data.maintenanceCosts.estimated ?? 0).toLocaleString()}`,
                ],
                ['Unread Notifications', data.kpis.unreadNotifications, 'In-app & email alerts'],
              ].map(([label, value, sub, accent]) => (
                <div key={label as string} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-medium text-slate-400">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${(accent as string) || 'text-white'}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-200 mb-4">Work Orders by Lifecycle Status</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statusChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-200 mb-4">
                  Top Machines by Maintenance Spend (LKR)
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={costChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="cost" fill="#818cf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {data.upcomingMaintenance?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-200 mb-3">
                  Upcoming Scheduled Preventive Maintenance
                </h2>
                <Table
                  columns={['Asset Code', 'Equipment Name', 'Plant Location', 'Status', 'Next PM Due']}
                  rows={data.upcomingMaintenance.map((a: any) => [
                    <span key="c" className="font-mono text-sky-400 font-semibold">{a.code}</span>,
                    a.name,
                    a.location,
                    <span key="s" className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-200">
                      {a.status}
                    </span>,
                    new Date(a.nextMaintenanceAt).toLocaleDateString(),
                  ])}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
