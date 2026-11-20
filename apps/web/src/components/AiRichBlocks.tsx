'use client';
import React, { useState } from 'react';
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
  ArrowRight,
  BarChart3,
  Check,
  Compass,
  Download,
  PieChart as PieIcon,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import Avatar from './Avatar';
import { api } from '@/lib/api';

const CHART_PALETTE = ['#00df82', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e'];

const TONE_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-[#00df82] border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

const KPI_BORDER_MAP: Record<string, string> = {
  emerald: 'border-emerald-500/25 bg-emerald-500/[0.05]',
  amber: 'border-amber-500/25 bg-amber-500/[0.05]',
  rose: 'border-rose-500/25 bg-rose-500/[0.05]',
  blue: 'border-sky-500/25 bg-sky-500/[0.05]',
  purple: 'border-purple-500/25 bg-purple-500/[0.05]',
};

function InteractiveChartBlock({ block, compact }: { block: any; compact?: boolean }) {
  const [chartType, setChartType] = useState<'bar' | 'area' | 'donut'>(block.defaultChartType || 'bar');
  const data = block.data || [];
  if (!data.length) return null;

  const prefix = block.valuePrefix ?? '';
  const suffix = block.valueSuffix ?? '';

  return (
    <div className="rounded-2xl bg-[#08121f]/95 border border-white/[0.08] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-bold text-white">{block.title}</p>
          {block.subtitle && <p className="text-[11px] text-slate-400">{block.subtitle}</p>}
        </div>

        {/* Live Chart Mode Switcher */}
        <div className="inline-flex items-center rounded-xl bg-white/[0.04] border border-white/10 p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              chartType === 'bar' ? 'bg-[#00df82] text-[#042114]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={11} /> Bar
          </button>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              chartType === 'area' ? 'bg-[#00df82] text-[#042114]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={11} /> Area
          </button>
          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              chartType === 'donut' ? 'bg-[#00df82] text-[#042114]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieIcon size={11} /> Donut
          </button>
        </div>
      </div>

      <div className={compact ? 'h-40' : 'h-52'}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip
                formatter={(val: any) => [`${prefix}${Number(val).toLocaleString()}${suffix}`, 'Value']}
                contentStyle={{
                  background: '#0b1626',
                  border: '1px solid rgba(0,223,130,0.3)',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="value" fill="#00df82" radius={[7, 7, 0, 0]} maxBarSize={38} />
            </BarChart>
          ) : chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="genUiArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00df82" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00df82" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip
                formatter={(val: any) => [`${prefix}${Number(val).toLocaleString()}${suffix}`, 'Value']}
                contentStyle={{
                  background: '#0b1626',
                  border: '1px solid rgba(0,223,130,0.3)',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#00df82" strokeWidth={2.5} fill="url(#genUiArea)" />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={compact ? 36 : 46}
                outerRadius={compact ? 58 : 72}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any) => [`${prefix}${Number(val).toLocaleString()}${suffix}`, 'Value']}
                contentStyle={{
                  background: '#0b1626',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InteractiveTableBlock({ block }: { block: any }) {
  const [filter, setFilter] = useState('');
  const allRows: any[] = block.rows || [];
  const filtered = !filter.trim()
    ? allRows
    : allRows.filter((r) => r.cells.join(' ').toLowerCase().includes(filter.toLowerCase()));

  function downloadCsv() {
    const header = (block.columns || []).map((c: string) => `"${c}"`).join(',');
    const body = filtered
      .map((r) => r.cells.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = block.exportFilename || 'opspilot-ai-query.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl bg-[#08121f]/95 border border-white/[0.08] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-white">{block.title}</p>
          {block.subtitle && <p className="text-[10.5px] text-slate-400">{block.subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {allRows.length > 3 && (
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter rows..."
                className="pl-7 pr-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-slate-200 placeholder:text-slate-500 w-32 focus:outline-none focus:border-emerald-400/50"
              />
            </div>
          )}
          {allRows.length > 0 && (
            <button
              type="button"
              onClick={downloadCsv}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[#00df82] text-[10.5px] font-semibold inline-flex items-center gap-1"
            >
              <Download size={11} /> CSV
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold text-slate-400 bg-white/[0.02]">
              {(block.columns || []).map((col: string) => (
                <th key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, rIdx) => (
              <tr key={rIdx} className="border-b last:border-b-0 border-white/[0.04] hover:bg-emerald-500/[0.05]">
                {row.cells.map((cell: string, cIdx: number) => {
                  if (cIdx === 0 && row.avatarName) {
                    return (
                      <td key={cIdx} className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={row.avatarName} size={24} />
                          <span className="font-semibold text-white">{cell}</span>
                        </div>
                      </td>
                    );
                  }
                  if (cIdx === row.badgeIndex) {
                    const cls = TONE_MAP[row.badgeTone || 'emerald'] || TONE_MAP.emerald;
                    return (
                      <td key={cIdx} className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${cls}`}>
                          {cell}
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={cIdx}
                      className={`px-3.5 py-2.5 whitespace-nowrap ${
                        cIdx === 0 ? 'font-semibold text-white' : 'text-slate-300'
                      }`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={block.columns?.length || 1} className="px-4 py-6 text-center text-slate-500 text-xs">
                  No matching database records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionCardsBlock({ block }: { block: any }) {
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decideApproval(id: string, decision: 'APPROVED' | 'REJECTED') {
    setBusyId(id);
    try {
      await api(`/approvals/${id}/decide`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          comment: `${decision} directly inside OpsPilot AI Copilot`,
        }),
      });
      setStatuses((prev) => ({ ...prev, [id]: decision }));
    } catch {
      // ignore if user lacks RBAC role
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl bg-[#08121f]/95 border border-white/[0.08] p-4 space-y-2.5">
      <p className="text-xs font-bold text-white">{block.title}</p>
      {(block.items || []).map((item: any) => {
        const currentStatus = statuses[item.id] || item.status;
        const canAct = item.canExecute && currentStatus === 'PENDING';
        const stCls =
          currentStatus === 'APPROVED'
            ? TONE_MAP.emerald
            : currentStatus === 'REJECTED'
              ? TONE_MAP.rose
              : TONE_MAP.amber;

        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{item.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {item.subtitle}
                {item.amount ? ` · ${item.amount}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${stCls}`}>
                {currentStatus}
              </span>
              {canAct && (
                <>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => decideApproval(item.id, 'APPROVED')}
                    className="px-2.5 py-1 rounded-lg ops-btn-primary text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => decideApproval(item.id, 'REJECTED')}
                    className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AiRichBlocks({
  blocks,
  onNavigate,
  compact = false,
}: {
  blocks?: any[];
  onNavigate: (route: string) => void;
  compact?: boolean;
}) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-3 mt-3">
      {blocks.map((block, idx) => {
        if (block.type === 'navigation_card') {
          return (
            <div
              key={idx}
              className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.14] via-[#0a1929] to-[#08121f] border border-emerald-400/35 p-4 space-y-3 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-[10.5px] font-bold text-[#00df82]">
                  <Compass size={12} /> {block.badge} · {block.route}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate(block.route)}
                  className="px-3 py-1.5 rounded-xl ops-btn-primary text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <span>Open {block.title}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{block.title}</h4>
                <p className="text-xs text-slate-300 mt-0.5">{block.description}</p>
              </div>

              {block.steps && block.steps.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {block.steps.map((s: string, si: number) => (
                    <div key={si} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-[#00df82] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {si + 1}
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {block.relatedRoutes && block.relatedRoutes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.08]">
                  <span className="text-[10.5px] text-slate-400 mr-1">Related:</span>
                  {block.relatedRoutes.map((rel: any) => (
                    <button
                      key={rel.route}
                      type="button"
                      onClick={() => onNavigate(rel.route)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-emerald-500/20 border border-white/10 text-[11px] text-slate-200 hover:text-[#00df82] transition-colors"
                    >
                      {rel.label} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (block.type === 'kpi_grid') {
          return (
            <div key={idx} className="space-y-2">
              {block.title && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/90 flex items-center gap-1.5">
                  <Sparkles size={12} /> {block.title}
                </p>
              )}
              <div
                className={`grid gap-2.5 ${
                  compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                }`}
              >
                {(block.items || []).map((k: any, kIdx: number) => (
                  <div
                    key={kIdx}
                    className={`rounded-xl border p-3 ${KPI_BORDER_MAP[k.tone || 'emerald'] || KPI_BORDER_MAP.emerald}`}
                  >
                    <p className="text-[10.5px] font-medium text-slate-400 truncate">{k.label}</p>
                    <p className="text-base sm:text-lg font-extrabold text-white mt-0.5 truncate">{k.value}</p>
                    {k.subtext && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{k.subtext}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (block.type === 'ranked_list') {
          return (
            <div key={idx} className="rounded-2xl bg-[#08121f]/95 border border-white/[0.08] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">{block.title}</p>
                  {block.subtitle && <p className="text-[10.5px] text-slate-400">{block.subtitle}</p>}
                </div>
                {block.actionRoute && (
                  <button
                    type="button"
                    onClick={() => onNavigate(block.actionRoute)}
                    className="px-3 py-1 rounded-lg ops-btn-primary text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    <span>{block.actionLabel || 'View Details'}</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {(block.items || []).map((row: any) => {
                  const medalColors: Record<number, string> = {
                    1: 'bg-[#00df82] text-[#052014]',
                    2: 'bg-sky-400 text-[#061826]',
                    3: 'bg-amber-400 text-[#231503]',
                  };
                  return (
                    <div key={row.rank} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`h-5 w-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                              medalColors[row.rank] || 'bg-slate-600 text-white'
                            }`}
                          >
                            {row.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{row.name}</p>
                            {row.subtitle && <p className="text-[10px] text-slate-400 truncate">{row.subtitle}</p>}
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#00df82] shrink-0">{row.value}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#00df82] to-emerald-500"
                          style={{ width: `${Math.min(100, row.percent || 40)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (block.type === 'chart') {
          return <InteractiveChartBlock key={idx} block={block} compact={compact} />;
        }

        if (block.type === 'data_table') {
          return <InteractiveTableBlock key={idx} block={block} />;
        }

        if (block.type === 'action_cards') {
          return <ActionCardsBlock key={idx} block={block} />;
        }

        if (block.type === 'feature_catalog') {
          return (
            <div key={idx} className="rounded-2xl bg-[#08121f]/95 border border-white/[0.08] p-4 space-y-3">
              <p className="text-xs font-bold text-white">{block.title}</p>
              <div className={`grid gap-2.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {(block.features || []).map((f: any) => (
                  <button
                    key={f.route}
                    type="button"
                    onClick={() => onNavigate(f.route)}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-emerald-500/[0.12] border border-white/[0.06] hover:border-emerald-400/35 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#00df82]">{f.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#00df82]">
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{f.summary}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
