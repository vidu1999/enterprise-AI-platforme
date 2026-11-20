'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

const PROMPTS = [
  'Which machines have the highest maintenance costs this month?',
  'What MRO spare parts are currently low on stock?',
  'Show critical and open work orders',
  'What is the CNC spindle vibration SOP threshold?',
  'Are there any pending purchase order approvals?',
];

export default function AiAssistantPage() {
  const [q, setQ] = useState(PROMPTS[0]);
  const [answer, setAnswer] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', category: 'SOP', content: '' });
  const [error, setError] = useState('');

  async function loadDocs() {
    const list = await api('/ai/documents').catch(() => []);
    setDocs(list);
  }

  useEffect(() => {
    loadDocs();
  }, []);

  async function runQuery(questionText: string) {
    setLoading(true);
    setError('');
    try {
      const res = await api('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question: questionText }),
      });
      setAnswer(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addDoc(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/ai/documents', {
        method: 'POST',
        body: JSON.stringify(docForm),
      });
      setDocForm({ title: '', category: 'SOP', content: '' });
      loadDocs();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Permission-Aware AI Business Assistant &amp; RAG
            </h1>
            <p className="text-sm text-slate-400">
              Queries strictly authorized tenant PostgreSQL aggregates and indexed company SOP policies with evidence
              and source citations.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-sm text-rose-300">{error}</div>
          )}

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runQuery(q);
              }}
              className="flex gap-2"
            >
              <input
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:border-sky-500 outline-none"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask about machine maintenance costs, low stock, open work orders, or SOP thresholds…"
              />
              <button
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Analyzing…' : 'Ask OpsPilot AI'}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                  onClick={() => {
                    setQ(s);
                    runQuery(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {answer && (
              <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                    OpsPilot Intelligence Response
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300">
                    Engine: {answer.mode}
                  </span>
                </div>
                <p className="text-base text-slate-100 leading-relaxed">{answer.answer}</p>

                {answer.evidence?.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Verified Data Evidence
                    </p>
                    <ul className="list-disc ml-5 space-y-1 text-xs text-slate-300">
                      {answer.evidence.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {answer.citations?.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Cited Company SOP &amp; Policy Sources
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {answer.citations.map((c: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <p className="text-xs font-bold text-sky-300">{c.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{c.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Indexed Knowledge Base ({docs.length} Authorized Documents)
              </h2>
              <div className="space-y-3">
                {docs.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{d.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-sky-300">
                        {d.category} · ≥ {d.minRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{d.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={addDoc}
              className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 h-fit"
            >
              <h2 className="text-sm font-bold text-white">Index New SOP / Policy</h2>
              <p className="text-xs text-slate-400">
                Available to Company Admins &amp; Managers for instant RAG citation retrieval.
              </p>
              <input
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
                placeholder="Document Title (e.g. SOP-ELC-009)"
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                required
              />
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
                value={docForm.category}
                onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
              >
                <option value="SOP">Standard Operating Procedure (SOP)</option>
                <option value="POLICY">Procurement / HR Policy</option>
                <option value="SAFETY">Safety &amp; LOTO Standard</option>
              </select>
              <textarea
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm"
                placeholder="Policy content, thresholds, escalation rules…"
                value={docForm.content}
                onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                required
              />
              <button className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm">
                Index Document
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
