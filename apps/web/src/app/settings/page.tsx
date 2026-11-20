'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, ShieldCheck, Upload } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

type SettingsTab = 'Company' | 'Users' | 'Roles' | 'Notifications' | 'Security';

const RBAC_MATRIX = [
  { capability: 'Manage Organization & System Settings', admin: true, manager: false, employee: false, viewer: false },
  { capability: 'Approve Purchase Orders & Escalations', admin: true, manager: true, employee: false, viewer: false },
  { capability: 'Manage Inventory, Suppliers & Assets', admin: true, manager: true, employee: true, viewer: false },
  { capability: 'Create & Transition Work Orders', admin: true, manager: true, employee: true, viewer: false },
  { capability: 'View Dashboards, Reports & AI Copilot', admin: true, manager: true, employee: true, viewer: true },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('Company');
  const [company, setCompany] = useState<any>(null);
  const [emailField, setEmailField] = useState('contact@opspilot.lk');
  const [phoneField, setPhoneField] = useState('+94 11 234 5678');
  const [addressField, setAddressField] = useState('No. 123, Main Street, Colombo, Sri Lanka');
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    smsAlerts: false,
    autoBackup: true,
    twoFactorAuth: true,
  });
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/companies/me')
      .then((c) => {
        setCompany(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSavedMsg('');
    setError('');
    try {
      const updated = await api('/companies/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: company.name,
          industry: company.industry,
          timezone: company.timezone,
          currency: company.currency,
        }),
      });
      setCompany(updated);
      setSavedMsg('Company settings saved and recorded in audit log.');
      setTimeout(() => setSavedMsg(''), 3500);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        checked ? 'bg-[#00df82] shadow-[0_0_12px_rgba(0,223,130,0.45)]' : 'bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Organization profile, RBAC governance, notification channels, and security controls
        </p>
      </div>

      {/* Underline Settings Tabs matching Reference */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-6 overflow-x-auto">
        {(['Company', 'Users', 'Roles', 'Notifications', 'Security'] as SettingsTab[]).map((t) => (
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

      {savedMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-[#00df82]" />
          <span>{savedMsg}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      {tab === 'Company' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Card: Company Information */}
          <div className="lg:col-span-7 ops-card rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-5">Company Information</h2>

            {/* HQ Thumbnail + Brand Header matching Reference */}
            <div className="flex items-center gap-4 mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <img
                src="/images/login-hq-bg.jpg"
                alt="Company HQ"
                className="h-16 w-16 rounded-xl object-cover border border-emerald-400/30 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {company?.name || 'OpsPilot (Pvt) Ltd'}
                </p>
                <p className="text-xs text-slate-400"> Tenant Slug: {company?.slug || 'demo-company'}</p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5">
                <Upload size={13} className="text-[#00df82]" /> HQ Profile
              </span>
            </div>

            {company && (
              <form onSubmit={saveCompany} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Company Name</label>
                  <input
                    value={company.name || ''}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl ops-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={emailField}
                      onChange={(e) => setEmailField(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl ops-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Phone</label>
                    <input
                      value={phoneField}
                      onChange={(e) => setPhoneField(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl ops-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Address</label>
                  <input
                    value={addressField}
                    onChange={(e) => setAddressField(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl ops-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Timezone</label>
                    <input
                      value={company.timezone || 'Asia/Colombo'}
                      onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl ops-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Currency</label>
                    <input
                      value={company.currency || 'LKR'}
                      onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl ops-input"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="px-6 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Card: System Preferences matching Reference */}
          <div className="lg:col-span-5 space-y-6">
            <div className="ops-card rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-5">System Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div>
                    <p className="text-sm font-semibold text-white">Email Notifications</p>
                    <p className="text-xs text-slate-400">Dispatch workflow &amp; PO alerts via email</p>
                  </div>
                  <Toggle
                    checked={prefs.emailNotifications}
                    onChange={() => setPrefs((p) => ({ ...p, emailNotifications: !p.emailNotifications }))}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div>
                    <p className="text-sm font-semibold text-white">SMS Alerts</p>
                    <p className="text-xs text-slate-400">Urgent machine breakdown SMS escalation</p>
                  </div>
                  <Toggle
                    checked={prefs.smsAlerts}
                    onChange={() => setPrefs((p) => ({ ...p, smsAlerts: !p.smsAlerts }))}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div>
                    <p className="text-sm font-semibold text-white">Auto Backup</p>
                    <p className="text-xs text-slate-400">Nightly encrypted PostgreSQL snapshot</p>
                  </div>
                  <Toggle
                    checked={prefs.autoBackup}
                    onChange={() => setPrefs((p) => ({ ...p, autoBackup: !p.autoBackup }))}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Two-Factor Auth</p>
                    <p className="text-xs text-slate-400">Require MFA for Administrator &amp; Manager roles</p>
                  </div>
                  <Toggle
                    checked={prefs.twoFactorAuth}
                    onChange={() => setPrefs((p) => ({ ...p, twoFactorAuth: !p.twoFactorAuth }))}
                  />
                </div>
              </div>
            </div>

            <div className="ops-card rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-[#00df82] flex items-center justify-center">
                  <ShieldCheck size={19} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Immutable Audit Ledger</p>
                  <p className="text-[11px] text-slate-400">Inspect every state mutation across your tenant</p>
                </div>
              </div>
              <Link href="/audit" className="text-xs font-bold text-[#00df82] hover:underline">
                Open Logs →
              </Link>
            </div>
          </div>
        </div>
      )}

      {tab === 'Users' && (
        <div className="ops-card rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-2">User Provisioning &amp; Directory</h2>
          <p className="text-xs text-slate-400 mb-4">
            Manage employee accounts, department assignments, and active sessions in the Employee Management module.
          </p>
          <Link href="/employees" className="inline-flex px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
            Open Employee Management →
          </Link>
        </div>
      )}

      {tab === 'Roles' && (
        <div className="ops-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="text-base font-bold text-white">Role-Based Access Control (RBAC) Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced at NestJS controller level via JwtAuthGuard + RolesGuard and propagated to AI RAG scope
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-slate-400">
                  <th className="px-5 py-3">Capability</th>
                  <th className="px-5 py-3">COMPANY_ADMIN</th>
                  <th className="px-5 py-3">MANAGER</th>
                  <th className="px-5 py-3">EMPLOYEE</th>
                  <th className="px-5 py-3">VIEWER</th>
                </tr>
              </thead>
              <tbody>
                {RBAC_MATRIX.map((r) => (
                  <tr key={r.capability} className="border-b last:border-b-0 border-white/[0.045]">
                    <td className="px-5 py-3.5 font-medium text-white">{r.capability}</td>
                    {[r.admin, r.manager, r.employee, r.viewer].map((ok, idx) => (
                      <td key={idx} className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold ${
                            ok ? 'bg-emerald-500/15 text-[#00df82]' : 'bg-white/[0.05] text-slate-500'
                          }`}
                        >
                          {ok ? 'Allowed' : 'Restricted'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="ops-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Real-Time Socket.IO &amp; Alert Routing</h2>
          <p className="text-xs text-slate-400">
            WebSocket events broadcast instantaneously to tenant rooms (`company:&lt;id&gt;`) and user rooms (`user:&lt;id&gt;`) whenever low-stock thresholds or approval escalations trigger.
          </p>
          <Link href="/notifications" className="inline-flex px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
            View Notification Feed →
          </Link>
        </div>
      )}

      {tab === 'Security' && (
        <div className="ops-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-[#00df82] flex items-center justify-center">
              <Lock size={19} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Enterprise Security Posture</h2>
              <p className="text-xs text-slate-400">
                Bcrypt password hashing · Short-lived JWT access tokens · Single-use SHA-256 refresh token rotation · Helmet + Throttler rate limiting
              </p>
            </div>
          </div>
          <Link href="/audit" className="inline-flex px-4 py-2.5 rounded-xl ops-btn-primary text-xs font-bold">
            Inspect Security Audit Trail →
          </Link>
        </div>
      )}
    </AppShell>
  );
}
