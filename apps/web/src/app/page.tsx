import Link from 'next/link';

const PILLARS = [
  {
    title: 'Multi-Tenant Isolation & RBAC',
    desc: 'Row-level company_id scoping across 15 PostgreSQL tables with 5 role tiers (SUPER_ADMIN to VIEWER), JWT + SHA-256 refresh token rotation.',
  },
  {
    title: 'Automated MRO Procurement',
    desc: 'Outbound spare-part consumption below reorder threshold automatically creates a Purchase Request, Approval workflow, and real-time alert.',
  },
  {
    title: 'Preventive & Corrective Maintenance',
    desc: 'Track industrial assets, scheduled preventive intervals, technician assignments, SLAs, and actual vs. estimated maintenance spend.',
  },
  {
    title: 'Permission-Aware AI & SOP RAG',
    desc: 'Ask operational questions in plain English. FastAPI + Ollama / deterministic engine answers with live metrics and cited SOP policies.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-slate-950 font-black">
            OP
          </span>
          <span className="text-xl font-bold tracking-tight">OpsPilot</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <a href="/docs" target="_blank" rel="noreferrer" className="px-3 py-2 text-slate-300 hover:text-sky-400">
            API Docs (OpenAPI)
          </a>
          <Link href="/login" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium">
            Sign in
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold">
            Onboard Company
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-5">
          Enterprise Operations Intelligence Platform
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Run maintenance, MRO inventory, approvals &amp; AI insights in{' '}
          <span className="text-sky-400">one multi-tenant system</span>.
        </h1>
        <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-10">
          Built with Next.js, TypeScript, NestJS, PostgreSQL, Redis, Socket.IO, and FastAPI — engineered for real
          industrial &amp; enterprise workflows with audit governance and permission-aware AI.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20"
          >
            Launch Live Demo Workspace →
          </Link>
          <Link
            href="/register"
            className="px-7 py-3.5 rounded-xl border border-slate-700 hover:bg-slate-900 font-semibold text-slate-200"
          >
            Create Isolated Tenant
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5 text-left">
          {PILLARS.map((p) => (
            <div key={p.title} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-base font-bold text-sky-300 mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Demo credentials pre-seeded: <code className="text-slate-300">admin@demo.local</code> /{' '}
        <code className="text-slate-300">Demo1234!</code> · Multi-tenant PostgreSQL 16 + NestJS + FastAPI
      </footer>
    </main>
  );
}
