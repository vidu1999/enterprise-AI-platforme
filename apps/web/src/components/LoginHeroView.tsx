'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Headphones, Lock, User } from 'lucide-react';
import { api, setTokens } from '@/lib/api';
import OpsLogo from './OpsLogo';

const DEMO_ROLES = [
  { label: 'Admin (Vidura)', email: 'admin@demo.local' },
  { label: 'Manager (Kavindu)', email: 'manager@demo.local' },
  { label: 'Technician', email: 'tech@demo.local' },
  { label: 'Auditor (Viewer)', email: 'viewer@demo.local' },
  { label: 'Tenant #2', email: 'admin@colombologistics.local' },
];

export default function LoginHeroView() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('Demo1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function performLogin(targetEmail: string, targetPassword: string) {
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      setTokens(data.accessToken, data.refreshToken, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    performLogin(email, password);
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex items-stretch bg-[#060d17] text-white">
      {/* Full-bleed Corporate HQ Twilight Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-[1.01]"
        style={{ backgroundImage: "url('/images/login-hq-bg.jpg')" }}
      />
      {/* Cinematic Emerald & Dark Vignette Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(95deg, rgba(5,12,21,0.88) 0%, rgba(6,16,28,0.45) 48%, rgba(6,14,24,0.86) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 12% 88%, rgba(0,223,130,0.22), transparent 45%), radial-gradient(circle at 88% 18%, rgba(0,223,130,0.14), transparent 45%)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-10 flex flex-col lg:flex-row items-stretch justify-between gap-10">
        {/* Left Brand & Value Proposition Column */}
        <div className="flex-1 flex flex-col justify-between py-2">
          <div>
            <OpsLogo size="lg" subtitle="Smarter Operations. Greater Productivity." />
          </div>

          <div className="my-auto pt-12 lg:pt-28 pb-8 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-lg">
              Manage.
              <br />
              Automate. Grow.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-200/90 max-w-md leading-relaxed drop-shadow">
              The Complete Operations Intelligence Platform for Modern Businesses.
            </p>

            {/* Bottom Stats Bar matching Reference */}
            <div className="mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-7 sm:gap-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-[#00df82]">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white leading-none">500+</p>
                  <p className="text-xs text-slate-300 mt-0.5">Companies</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-[#00df82]">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white leading-none">99.9%</p>
                  <p className="text-xs text-slate-300 mt-0.5">Uptime</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-[#00df82]">
                  <Headphones size={20} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white leading-none">24/7</p>
                  <p className="text-xs text-slate-300 mt-0.5">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Floating Glassmorphic Sign-In Card */}
        <div className="w-full max-w-[430px] mx-auto lg:mx-0 my-auto">
          <div className="rounded-[28px] bg-[#091320]/88 backdrop-blur-2xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.65),0_0_40px_rgba(0,217,126,0.10)] p-7 sm:p-9">
            <div className="text-center mb-7">
              <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">Welcome Back!</h2>
              <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111e2e]/90 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00df82]"
                />
              </div>

              {/* Password Input with Show/Hide Eye */}
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#111e2e]/90 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00df82]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 accent-[#00df82]"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@demo.local');
                    setPassword('Demo1234!');
                  }}
                  className="text-[#00df82] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Glowing Green Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl ops-btn-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{loading ? 'Signing In…' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="px-3 text-xs text-slate-400 bg-[#091320] whitespace-nowrap">or continue with</span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Google & Microsoft SSO Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => performLogin('admin@demo.local', 'Demo1234!')}
                className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-[#111e2e]/90 hover:bg-[#17283d] border border-white/10 text-xs font-semibold text-slate-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-2H12z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => performLogin('manager@demo.local', 'Demo1234!')}
                className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-[#111e2e]/90 hover:bg-[#17283d] border border-white/10 text-xs font-semibold text-slate-100 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 23 23">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                </svg>
                <span>Microsoft</span>
              </button>
            </div>

            {/* Quick Demo Persona Chips */}
            <div className="mt-5 pt-4 border-t border-white/[0.07]">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 text-center mb-2">
                1-Click Demo Role Switcher
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {DEMO_ROLES.map((r) => (
                  <button
                    key={r.email}
                    type="button"
                    onClick={() => {
                      setEmail(r.email);
                      setPassword('Demo1234!');
                      performLogin(r.email, 'Demo1234!');
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#00df82] font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
