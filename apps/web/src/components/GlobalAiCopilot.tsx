'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Maximize2, SendHorizonal, Sparkles, X } from 'lucide-react';
import { api, getAiSettings } from '@/lib/api';
import {
  AiChatMessage,
  consumeArrivalHint,
  loadAiMessages,
  saveAiMessages,
  setArrivalHint,
} from '@/lib/ai-session';
import AiRichBlocks from './AiRichBlocks';

export default function GlobalAiCopilot() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [arrivalBanner, setArrivalBanner] = useState<{ pageTitle: string; highlightAction: string } | null>(null);
  const [pendingNav, setPendingNav] = useState<{ route: string; pageTitle: string } | null>(null);
  const navTimerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(loadAiMessages());
    const hint = consumeArrivalHint();
    if (hint && hint.route === pathname) {
      setArrivalBanner({ pageTitle: hint.pageTitle, highlightAction: hint.highlightAction });
      const t = setTimeout(() => setArrivalBanner(null), 9000);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  // Do not render floating orb on the dedicated full-page AI workspace
  if (pathname === '/ai-assistant') return null;

  function triggerMove(route: string, pageTitle?: string, highlightAction?: string) {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setPendingNav(null);
    if (pageTitle && highlightAction) {
      setArrivalHint({ route, pageTitle, highlightAction });
    }
    setOpen(false);
    router.push(route);
  }

  async function askCopilot(qText?: string) {
    const q = (qText ?? input).trim();
    if (!q || loading) return;
    if (!qText) setInput('');

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    saveAiMessages(nextHistory);
    setLoading(true);

    try {
      const settings = getAiSettings();
      const res = await api('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          currentPage: pathname,
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          openRouterKey: settings.openRouterKey || undefined,
          openRouterModel: settings.openRouterModel || undefined,
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
      };
      const updated = [...nextHistory, aiMsg];
      setMessages(updated);
      saveAiMessages(updated);

      const nav = res.intent?.autoNavigate;
      if (settings.autoNavigate && nav?.shouldMove && nav.route && nav.route !== pathname) {
        setPendingNav({ route: nav.route, pageTitle: nav.pageTitle });
        navTimerRef.current = setTimeout(() => {
          triggerMove(nav.route, nav.pageTitle, nav.highlightAction || 'Feature ready on this screen.');
        }, nav.delayMs || 1500);
      }
    } catch (err: any) {
      const errMsg: AiChatMessage = {
        id: `e-${Date.now()}`,
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

  return (
    <>
      {/* Arrival Guidance Banner after Auto-Navigation */}
      {arrivalBanner && !open && (
        <div className="fixed bottom-24 md:bottom-24 right-5 z-40 max-w-sm ops-card ops-card-glow rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00df82]">
              <Compass size={15} />
              <span>Moved to {arrivalBanner.pageTitle}</span>
            </div>
            <button onClick={() => setArrivalBanner(null)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{arrivalBanner.highlightAction}</p>
          <button
            type="button"
            onClick={() => {
              setArrivalBanner(null);
              setOpen(true);
            }}
            className="mt-2.5 text-[11px] font-bold text-[#00df82] hover:underline"
          >
            Continue chatting with OpsPilot AI →
          </button>
        </div>
      )}

      {/* Slide-Up Floating Copilot Window */}
      {open && (
        <div className="fixed bottom-20 md:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[76vh] ops-card ops-card-glow rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#07111d]/95 border-b border-white/[0.08] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/ai-robot.png"
                alt="AI"
                className="h-8 w-8 rounded-full object-cover border border-emerald-400/50"
              />
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  OpsPilot Copilot
                  <span className="h-2 w-2 rounded-full bg-[#00df82] animate-pulse" />
                </p>
                <p className="text-[10px] text-slate-400">Live SQL UI + Auto-Move Active</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                href="/ai-assistant"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white"
                title="Open Full-Screen AI Workspace"
              >
                <Maximize2 size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Pending Auto-Move Countdown Banner */}
          {pendingNav && (
            <div className="px-4 py-2.5 bg-emerald-500/20 border-b border-emerald-400/35 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#00df82] flex items-center gap-1.5">
                <Compass size={14} className="animate-spin" />
                Moving to {pendingNav.pageTitle}…
              </span>
              <button
                type="button"
                onClick={() => {
                  if (navTimerRef.current) clearTimeout(navTimerRef.current);
                  setPendingNav(null);
                }}
                className="px-2 py-0.5 rounded bg-black/40 text-white text-[11px] font-semibold"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[50vh]">
            {messages.slice(-8).map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-medium">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="rounded-2xl bg-[#0c192b]/95 border border-white/[0.08] p-3.5 space-y-2">
                  <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-line">{m.content}</p>
                  <AiRichBlocks
                    blocks={m.uiBlocks}
                    compact
                    onNavigate={(route) => triggerMove(route, 'Selected Module', 'Navigated from OpsPilot Copilot.')}
                  />
                  {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestedFollowUps.slice(0, 2).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => askCopilot(s)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 text-[10.5px] text-slate-300 hover:text-[#00df82]"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#00df82] animate-pulse">
                <Sparkles size={13} /> Analyzing live database &amp; features…
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askCopilot();
            }}
            className="p-3 border-t border-white/[0.08] bg-[#07111d]/95 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask DB data or say 'Go to inventory'..."
              className="flex-1 px-3.5 py-2.5 rounded-xl ops-input text-xs placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-9 rounded-xl ops-btn-primary flex items-center justify-center shrink-0"
            >
              <SendHorizonal size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Floating AI Copilot Trigger Orb */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open OpsPilot AI Copilot"
        className="fixed bottom-20 md:bottom-6 right-5 z-40 group flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-[#081524]/95 hover:bg-[#0d2036] border border-emerald-400/45 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_24px_rgba(0,223,130,0.28)] transition-all"
      >
        <div className="relative">
          <img
            src="/images/ai-robot.png"
            alt="AI Copilot"
            className="h-9 w-9 rounded-full object-cover border border-emerald-400/60"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00df82] ring-2 ring-[#081524]" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-extrabold text-white leading-none">Ask AI Copilot</p>
          <p className="text-[10px] text-[#00df82] mt-0.5">Live DB + Auto-Move</p>
        </div>
      </button>
    </>
  );
}
