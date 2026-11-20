'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowRight, BookOpen, Plus, SendHorizonal, Sparkles, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  featuredBreakdown?: { rank: number; name: string; cost: string }[];
  citations?: { title: string; category: string; excerpt?: string; snippet?: string }[];
  metrics?: Record<string, any>;
}

const MINI_TREND = [
  { wk: 'Wk 1', cost: 64000 },
  { wk: 'Wk 2', cost: 82000 },
  { wk: 'Wk 3', cost: 96000 },
  { wk: 'Wk 4', cost: 125000 },
];

const QUICK_PROMPTS = [
  'Which machines had the highest maintenance cost this month?',
  'Which inventory items are low on stock and need restocking?',
  'What is our CNC spindle overheat & lockout SOP?',
  'Summarize pending approvals and operational bottlenecks.',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'user',
      content: 'Which machines had the highest maintenance cost this month?',
    },
    {
      role: 'assistant',
      content: 'Here are the top 3 machines with the highest maintenance costs this month:',
      featuredBreakdown: [
        { rank: 1, name: 'Generator #1', cost: 'Rs. 125,000' },
        { rank: 2, name: 'Compressor #2', cost: 'Rs. 98,000' },
        { rank: 3, name: 'HVAC Unit #1', cost: 'Rs. 87,000' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [showSopModal, setShowSopModal] = useState(false);
  const [sopForm, setSopForm] = useState({ title: '', category: 'Maintenance SOP', content: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api('/ai/documents')
      .then(setDocs)
      .catch(() => undefined);

    // Hydrate top 3 breakdown from live tenant analytics if available
    api('/analytics/dashboard')
      .then((dash) => {
        if (dash?.costsByAsset?.length >= 3) {
          const top3 = dash.costsByAsset.slice(0, 3).map((a: any, idx: number) => ({
            rank: idx + 1,
            name: a.name,
            cost: `Rs. ${Number(a.cost || 0).toLocaleString()}`,
          }));
          setMessages((prev) =>
            prev.map((m, i) => (i === 1 ? { ...m, featuredBreakdown: top3 } : m)),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  async function ask(questionText?: string) {
    const q = (questionText ?? input).trim();
    if (!q || loading) return;
    if (!questionText) setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await api('/ai/ask', { method: 'POST', body: JSON.stringify({ question: q }) });
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.answer,
          citations: res.citations,
          metrics: res.metrics,
        },
      ]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function createSop(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/ai/documents', { method: 'POST', body: JSON.stringify(sopForm) });
      setSopForm({ title: '', category: 'Maintenance SOP', content: '' });
      setShowSopModal(false);
      const updated = await api('/ai/documents');
      setDocs(updated);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Business Assistant</h1>
          <p className="text-xs text-slate-400 mt-1">
            Permission-aware operational copilot grounded in live tenant telemetry &amp; SOP RAG knowledge
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSopModal(true)}
          className="px-4 py-2.5 rounded-xl ops-card text-xs font-semibold text-slate-200 hover:border-emerald-500/40 flex items-center gap-2"
        >
          <Plus size={15} className="text-[#00df82]" />
          <span>Index SOP Document ({docs.length})</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* 2-Column Split matching Reference AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: 3D AI Robot Hero Card + Quick Prompts */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="ops-card ops-card-glow rounded-2xl overflow-hidden flex flex-col justify-between relative">
            <div className="relative h-72 w-full overflow-hidden bg-[#07131e]">
              <img
                src="/images/ai-robot.png"
                alt="OpsPilot AI Assistant"
                className="w-full h-full object-cover object-top"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, transparent 45%, rgba(10,19,31,0.96) 100%)',
                }}
              />
              <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07131e]/85 backdrop-blur-md border border-emerald-400/35 text-[11px] font-semibold text-[#00df82]">
                <span className="h-2 w-2 rounded-full bg-[#00df82] animate-pulse" />
                OpsPilot Copilot Online
              </div>
              <div className="absolute bottom-3.5 left-4 right-4">
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={15} className="text-[#00df82]" />
                  Intelligent Operations Analyst
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Ask about equipment spend, stockouts, purchase approvals, or SOP procedures.
                </p>
              </div>
            </div>

            {/* Suggested Prompts */}
            <div className="p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Suggested Queries
              </p>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-400/35 text-xs text-slate-300 hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Indexed SOP Knowledge Base Summary */}
          <div className="ops-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#00df82]" /> SOP Knowledge Base
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">{docs.length} indexed</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05] flex items-center justify-between gap-2"
                >
                  <span className="text-xs text-slate-200 truncate">{d.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-[#00df82] shrink-0">
                    {d.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Conversational Workspace matching Reference */}
        <div className="lg:col-span-8 ops-card rounded-2xl flex flex-col min-h-[600px] overflow-hidden">
          <div className="flex-1 p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[540px]">
            {messages.map((m, idx) =>
              m.role === 'user' ? (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-lg px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-sm font-medium shadow-lg">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex items-start gap-3">
                  <img
                    src="/images/ai-robot.png"
                    alt="AI"
                    className="h-9 w-9 rounded-full object-cover border border-emerald-400/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 max-w-2xl rounded-2xl rounded-tl-sm bg-[#0f1c2e]/95 border border-white/[0.08] p-4 sm:p-5 space-y-4">
                    <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">{m.content}</p>

                    {/* Featured Ranked Breakdown + Mini Trend Chart matching Reference */}
                    {m.featuredBreakdown && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {m.featuredBreakdown.map((row) => {
                            const rankColors: Record<number, string> = {
                              1: 'bg-[#00df82] text-[#052014]',
                              2: 'bg-sky-400 text-[#061826]',
                              3: 'bg-amber-400 text-[#231503]',
                            };
                            return (
                              <div
                                key={row.rank}
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.035] border border-white/[0.06]"
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`h-6 w-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                                      rankColors[row.rank] || rankColors[1]
                                    }`}
                                  >
                                    {row.rank}
                                  </span>
                                  <span className="text-sm font-semibold text-white">{row.name}</span>
                                </div>
                                <span className="text-sm font-bold text-[#00df82]">{row.cost}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Mini Embedded Maintenance Cost Trend Card */}
                        <div className="rounded-xl bg-[#091320]/90 border border-white/[0.07] p-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-300">Maintenance Cost Trend</span>
                            <Link
                              href="/reports"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg ops-btn-primary text-[11px] font-bold"
                            >
                              <span>View Details</span>
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                          <div className="h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={MINI_TREND}>
                                <defs>
                                  <linearGradient id="aiMiniEmerald" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00df82" stopOpacity={0.45} />
                                    <stop offset="95%" stopColor="#00df82" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="wk" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                  formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, 'Spend']}
                                  contentStyle={{
                                    background: '#0b1626',
                                    border: '1px solid rgba(0,223,130,0.28)',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="cost"
                                  stroke="#00df82"
                                  strokeWidth={2.5}
                                  fill="url(#aiMiniEmerald)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grounded RAG Citations */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-3 border-t border-white/[0.08] space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#00df82]">
                          Grounded SOP Citations
                        </p>
                        {m.citations.map((c, ci) => (
                          <div
                            key={ci}
                            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
                          >
                            <span className="font-semibold text-white">{c.title}</span>{' '}
                            <span className="text-emerald-400">({c.category})</span>
                            <p className="text-slate-400 mt-0.5">{c.excerpt || c.snippet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 pl-12 animate-pulse">
                <Sparkles size={14} /> Querying tenant telemetry &amp; SOP knowledge graph…
              </div>
            )}
          </div>

          {/* Bottom Message Input Bar matching Reference */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
            className="p-4 border-t border-white/[0.06] bg-[#091320]/70 flex items-center gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something about your business..."
              className="flex-1 px-4 py-3 rounded-xl ops-input text-sm placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Send message"
              className="h-11 w-11 rounded-xl ops-btn-primary flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <SendHorizonal size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Add SOP Document Modal */}
      {showSopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Index New SOP Document</h2>
              <button onClick={() => setShowSopModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createSop} className="space-y-3.5 text-sm">
              <input
                required
                placeholder="SOP Title (e.g. Generator #1 Load Transfer Procedure)"
                value={sopForm.title}
                onChange={(e) => setSopForm({ ...sopForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <input
                required
                placeholder="Category (Maintenance SOP, Procurement Policy, Safety)"
                value={sopForm.category}
                onChange={(e) => setSopForm({ ...sopForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <textarea
                required
                rows={5}
                placeholder="Paste full standard operating procedure text for RAG retrieval..."
                value={sopForm.content}
                onChange={(e) => setSopForm({ ...sopForm, content: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl ops-input"
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSopModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Index into RAG Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
