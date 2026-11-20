'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Copy,
  Database,
  KeyRound,
  Mic,
  MicOff,
  Plus,
  RotateCcw,
  SendHorizonal,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import AiRichBlocks from '@/components/AiRichBlocks';
import { api, getAiSettings, saveAiSettings } from '@/lib/api';
import {
  AiChatMessage,
  clearAiMessages,
  loadAiMessages,
  saveAiMessages,
  setArrivalHint,
} from '@/lib/ai-session';

const DB_PROMPTS = [
  'Which machines had the highest maintenance cost this month?',
  'Show all low stock and out of stock inventory items',
  'Show all employees and department breakdown',
  'Show pending workflow approvals',
  'Show purchase orders and supplier lead times',
];

const NAV_PROMPTS = [
  'Where can I add a new product to inventory?',
  'Take me to Reports & Analytics page',
  'Where do I configure 2FA and company settings?',
  'What features does this website have?',
];

const OPENROUTER_MODELS = [
  { id: 'openrouter/auto', label: 'OpenRouter Auto (Smart Best Model)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B Instruct (100% Free)' },
  { id: 'google/gemma-3-27b-it:free', label: 'Google Gemma 3 27B (100% Free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek V3 Chat (100% Free)' },
  { id: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
];

export default function AiAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [serverAiHealth, setServerAiHealth] = useState<any>(null);

  // AI Settings (OpenRouter Key + Auto-Move toggle)
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState('openrouter/auto');
  const [autoNavigate, setAutoNavigate] = useState(true);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState('');

  // Auto-Move countdown state
  const [pendingMove, setPendingMove] = useState<{
    route: string;
    pageTitle: string;
    highlightAction: string;
  } | null>(null);
  const navTimerRef = useRef<any>(null);

  // Voice Input & Copy state
  const [listening, setListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SOP Modal
  const [showSopModal, setShowSopModal] = useState(false);
  const [sopForm, setSopForm] = useState({ title: '', category: 'Maintenance SOP', content: '' });
  const [error, setError] = useState('');

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loaded = loadAiMessages();
    setMessages(loaded);

    const s = getAiSettings();
    setOpenRouterKey(s.openRouterKey);
    setOpenRouterModel(s.openRouterModel);
    setAutoNavigate(s.autoNavigate);

    api('/ai/documents')
      .then(setDocs)
      .catch(() => undefined);

    api('/ai/health')
      .then(setServerAiHealth)
      .catch(() => undefined);

    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function executeNavigation(route: string, pageTitle = 'Selected Feature', highlightAction = 'Navigated by OpsPilot AI.') {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setPendingMove(null);
    setArrivalHint({ route, pageTitle, highlightAction });
    router.push(route);
  }

  function cancelPendingMove() {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setPendingMove(null);
  }

  async function ask(questionText?: string) {
    const q = (questionText ?? input).trim();
    if (!q || loading) return;
    if (!questionText) setInput('');
    cancelPendingMove();

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    saveAiMessages(nextHistory);
    setLoading(true);

    try {
      const res = await api('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          currentPage: '/ai-assistant',
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          openRouterKey: openRouterKey || undefined,
          openRouterModel: openRouterModel || undefined,
        }),
      });

      const aiMsg: AiChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        mode: res.mode,
        modelUsed: res.modelUsed,
        intent: res.intent,
        uiBlocks: res.uiBlocks,
        suggestedFollowUps: res.suggestedFollowUps,
        citations: res.citations,
        evidence: res.evidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updated = [...nextHistory, aiMsg];
      setMessages(updated);
      saveAiMessages(updated);

      // Automatic Website Feature Navigation when user asks about a feature or asks to move!
      const nav = res.intent?.autoNavigate;
      if (autoNavigate && nav?.shouldMove && nav.route && nav.route !== '/ai-assistant') {
        const moveTarget = {
          route: nav.route,
          pageTitle: nav.pageTitle || nav.route,
          highlightAction: nav.highlightAction || 'Feature ready on this screen.',
        };
        setPendingMove(moveTarget);
        navTimerRef.current = setTimeout(() => {
          executeNavigation(moveTarget.route, moveTarget.pageTitle, moveTarget.highlightAction);
        }, nav.delayMs || 1600);
      }
    } catch (err: any) {
      const errMsg: AiChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message}`,
      };
      const updated = [...nextHistory, errMsg];
      setMessages(updated);
      saveAiMessages(updated);
    } finally {
      setLoading(false);
    }
  }

  function toggleVoiceMic() {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Voice recognition requires Chrome or Edge browser.');
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (ev: any) => {
      const transcript = ev.results?.[0]?.[0]?.transcript ?? '';
      setListening(false);
      if (transcript.trim()) {
        setInput(transcript);
        ask(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  function speakText(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[*#`]/g, ''));
    utter.rate = 1.03;
    window.speechSynthesis.speak(utter);
  }

  function copyMessage(id: string, text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function handleSaveAiConfig(e: React.FormEvent) {
    e.preventDefault();
    saveAiSettings({ openRouterKey, openRouterModel, autoNavigate });
    setShowKeyModal(false);
    setKeySavedToast(
      openRouterKey
        ? `OpenRouter LLM connected (${openRouterModel})!`
        : 'Using built-in OpsPilot SQL + Generative UI Engine.',
    );
    setTimeout(() => setKeySavedToast(''), 4000);
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

  const llmConnected = Boolean(openRouterKey || serverAiHealth?.openRouterConfigured);

  return (
    <AppShell>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Business Assistant</h1>
          <p className="text-xs text-slate-400 mt-1">
            Live PostgreSQL Generative UI · Automatic Website Feature Navigation · OpenRouter LLM &amp; SOP RAG
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Move Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !autoNavigate;
              setAutoNavigate(next);
              saveAiSettings({ autoNavigate: next });
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              autoNavigate
                ? 'bg-emerald-500/15 border-emerald-400/40 text-[#00df82]'
                : 'ops-card text-slate-400 border-white/10'
            }`}
            title="Automatically navigate to website modules when you ask about features"
          >
            <Compass size={14} />
            <span>Auto-Move: {autoNavigate ? 'ON' : 'OFF'}</span>
          </button>

          {/* Connect OpenRouter / LLM Key */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
              llmConnected
                ? 'bg-emerald-500/15 border-emerald-400/40 text-[#00df82]'
                : 'ops-card text-slate-200 hover:border-emerald-500/40'
            }`}
          >
            <KeyRound size={14} className="text-[#00df82]" />
            <span>{llmConnected ? 'OpenRouter LLM: Active' : 'Connect OpenRouter Key'}</span>
          </button>

          {/* Index SOP */}
          <button
            type="button"
            onClick={() => setShowSopModal(true)}
            className="px-3.5 py-2 rounded-xl ops-card text-xs font-semibold text-slate-200 hover:border-emerald-500/40 flex items-center gap-1.5"
          >
            <Plus size={14} className="text-[#00df82]" />
            <span>SOP ({docs.length})</span>
          </button>

          {/* Reset Chat */}
          <button
            type="button"
            onClick={() => setMessages(clearAiMessages())}
            className="p-2 rounded-xl ops-card text-slate-400 hover:text-white"
            title="Reset conversation"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {keySavedToast && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-200">
          {keySavedToast}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-300 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Auto-Move Live Countdown Banner */}
      {pendingMove && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-[#0b1727] border border-emerald-400/45 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Compass size={18} className="text-[#00df82] animate-spin" />
            <div>
              <p className="text-xs font-extrabold text-white">
                Website Feature Found — Moving automatically to {pendingMove.pageTitle} ({pendingMove.route})…
              </p>
              <p className="text-[11px] text-emerald-200/90">{pendingMove.highlightAction}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelPendingMove}
              className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-semibold text-slate-200"
            >
              Stay in Chat
            </button>
            <button
              type="button"
              onClick={() =>
                executeNavigation(pendingMove.route, pendingMove.pageTitle, pendingMove.highlightAction)
              }
              className="px-3.5 py-1.5 rounded-xl ops-btn-primary text-xs font-bold inline-flex items-center gap-1"
            >
              <span>Go Now</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 2-Column Split matching Reference Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: 3D Robot Hero + Database & Auto-Move Starters + SOPs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="ops-card ops-card-glow rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="relative h-60 w-full overflow-hidden bg-[#07131e]">
              <img
                src="/images/ai-robot.png"
                alt="OpsPilot AI Assistant"
                className="w-full h-full object-cover object-top"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, transparent 40%, rgba(10,19,31,0.97) 100%)',
                }}
              />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07131e]/85 backdrop-blur-md border border-emerald-400/35 text-[11px] font-semibold text-[#00df82]">
                <span className="h-2 w-2 rounded-full bg-[#00df82] animate-pulse" />
                {llmConnected ? 'OpenRouter LLM + Live SQL' : 'Live SQL + GenUI Active'}
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#00df82]" />
                  Ask Database or Auto-Navigate
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Renders live charts, tables &amp; approvals, or moves you straight to any website feature.
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#00df82] flex items-center gap-1.5 mb-1.5">
                  <Database size={12} /> Live Database Queries (GenUI)
                </p>
                <div className="space-y-1.5">
                  {DB_PROMPTS.map((q) => (
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

              <div className="pt-2 border-t border-white/[0.06]">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-1.5">
                  <Compass size={12} /> Website Feature Auto-Move
                </p>
                <div className="space-y-1.5">
                  {NAV_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-sky-500/15 border border-white/[0.06] hover:border-sky-400/35 text-xs text-slate-300 hover:text-white transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Indexed SOP Knowledge Base */}
          <div className="ops-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#00df82]" /> SOP RAG Knowledge
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">{docs.length} indexed</span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {docs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => ask(`Explain policy: ${d.title}`)}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.05] flex items-center justify-between gap-2"
                >
                  <span className="text-xs text-slate-200 truncate">{d.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-[#00df82] shrink-0">
                    {d.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Rich Generative UI Chat Workspace */}
        <div className="lg:col-span-8 ops-card rounded-2xl flex flex-col min-h-[650px] overflow-hidden">
          <div ref={chatScrollRef} className="flex-1 p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[590px]">
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-lg px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-sm font-medium shadow-lg">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex items-start gap-3">
                  <img
                    src="/images/ai-robot.png"
                    alt="AI"
                    className="h-9 w-9 rounded-full object-cover border border-emerald-400/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-[#0f1c2e]/95 border border-white/[0.08] p-4 sm:p-5 space-y-3">
                    {/* Telemetry & Intent Header Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {m.intent?.category === 'WEB_NAVIGATION' || m.intent?.category === 'WEB_FEATURE_GUIDE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-[10.5px] font-bold text-sky-300">
                            <Compass size={11} /> Website Feature Intelligence
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10.5px] font-bold text-[#00df82]">
                            <Database size={11} />
                            Live PostgreSQL
                            {m.intent?.tablesQueried?.length
                              ? ` · ${m.intent.tablesQueried.slice(0, 3).join(', ')}`
                              : ''}
                          </span>
                        )}

                        {m.mode === 'openrouter-llm' && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-[10px] font-bold text-purple-300">
                            LLM: {m.modelUsed || 'OpenRouter'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => speakText(m.content)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white"
                          title="Read aloud"
                        >
                          <Volume2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyMessage(m.id, m.content)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white"
                          title="Copy answer"
                        >
                          {copiedId === m.id ? <Check size={13} className="text-[#00df82]" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Natural Language Explanation */}
                    <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">{m.content}</p>

                    {/* Dynamic Generative UI Blocks (Charts, Tables, KPIs, Action Cards, Nav Cards) */}
                    <AiRichBlocks
                      blocks={m.uiBlocks}
                      onNavigate={(route) =>
                        executeNavigation(route, 'Selected Feature', 'Opened from OpsPilot AI Assistant.')
                      }
                    />

                    {/* Grounded RAG SOP Citations */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
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

                    {/* Smart Suggested Follow-Ups */}
                    {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {m.suggestedFollowUps.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => ask(sug)}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/35 text-[11px] font-medium text-slate-300 hover:text-[#00df82] transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-emerald-400 pl-12 animate-pulse">
                <Sparkles size={15} /> Inspecting live PostgreSQL tables, website routes &amp; building Generative UI…
              </div>
            )}
          </div>

          {/* Bottom Input Bar with Voice Mic + Send */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
            className="p-4 border-t border-white/[0.06] bg-[#091320]/80 flex items-center gap-2.5"
          >
            <button
              type="button"
              onClick={toggleVoiceMic}
              aria-label="Voice input"
              className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                listening
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Speak your question or navigation command"
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any database question OR say 'Take me to inventory / settings / reports'..."
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

      {/* Connect OpenRouter Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="ops-card ops-card-glow rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound size={18} className="text-[#00df82]" />
                Connect OpenRouter AI Key (Optional · Free Models Supported)
              </h2>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              OpsPilot&apos;s built-in <strong>SQL + Generative UI + Auto-Navigation Engine</strong> works 100% free with
              zero keys. Adding a free key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[#00df82] underline font-semibold"
              >
                openrouter.ai/keys
              </a>{' '}
              additionally enables frontier LLMs (Llama 3.3 70B Free, Gemma 3 Free, DeepSeek V3 Free, GPT-4o) over your
              live database!
            </p>

            <form onSubmit={handleSaveAiConfig} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">OpenRouter API Key (`sk-or-v1-...`)</label>
                <input
                  type="password"
                  placeholder="sk-or-v1-... (leave blank to use built-in engine or server env)"
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Preferred AI Model</label>
                <select
                  value={openRouterModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl ops-input"
                >
                  {OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                  Save AI Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add SOP Document Modal */}
      {showSopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
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
