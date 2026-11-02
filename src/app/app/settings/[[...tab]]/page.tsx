'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';

type SettingsTab = 'account' | 'access' | 'billing' | 'organizations' | 'api' | 'api-key' | 'labs';

export default function AccountSettingsPage() {
  const params = useParams<{ tab?: string[] }>();
  const router = useRouter();
  const rawInitialTab = Array.isArray(params?.tab) && params.tab[0] ? params.tab[0] : 'account';
  const normalizedInitial = (rawInitialTab === 'api-key' ? 'api' : rawInitialTab) as SettingsTab;

  const [tab, setTab] = useState<SettingsTab>(
    ['account', 'access', 'billing', 'organizations', 'api', 'labs'].includes(normalizedInitial)
      ? normalizedInitial
      : 'account'
  );
  const [deleteScheduledAt, setDeleteScheduledAt] = useState<string | null>(null);
  const [orgInviteEmail, setOrgInviteEmail] = useState('');
  const [orgInvites, setOrgInvites] = useState<
    Array<{ email: string; role: string; expiresIn: string }>
  >([]);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
    planTier: string;
    operatorGrantPlan: string | null;
    uiLanguage: string;
    themePreference: string;
    hasOpenAiByok: boolean;
    openAiKeyHint: string | null;
    dailyTokensUsed: number;
    dailyTokensLimit: number;
    monthlyTokensUsed: number;
    monthlyTokensLimit: number;
    storageBytesUsed: number;
    storageBytesLimit: number;
    labsFlags: Record<string, boolean>;
  } | null>(null);

  const [name, setName] = useState('');
  const [uiLanguage, setUiLanguage] = useState('en');
  const [themePreference, setThemePreference] = useState('light');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [passCodeInput, setPassCodeInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/account/profile')
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setName(data.user.name || '');
        setUiLanguage(data.user.uiLanguage || 'en');
        setThemePreference(data.user.themePreference || 'light');
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, uiLanguage, themePreference }),
    });
    if (res.ok) {
      setStatusMessage('Profile preferences saved.');
    }
  }

  async function handleSaveByok(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    const res = await fetch('/api/account/byok/openai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKeyInput }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser((prev) =>
        prev ? { ...prev, hasOpenAiByok: true, openAiKeyHint: data.keyHint } : prev
      );
      setApiKeyInput('');
      setStatusMessage(`OpenAI API key connected (${data.keyHint}).`);
    } else {
      setStatusMessage(data.message || 'Failed to save API key.');
    }
  }

  async function handleRemoveByok() {
    const res = await fetch('/api/account/byok/openai', { method: 'DELETE' });
    if (res.ok) {
      setUser((prev) =>
        prev ? { ...prev, hasOpenAiByok: false, openAiKeyHint: null } : prev
      );
      setStatusMessage('Personal OpenAI API key disconnected.');
    }
  }

  async function handleRedeemPass(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    const res = await fetch('/api/account/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: passCodeInput }),
    });
    const data = await res.json();
    if (res.ok) {
      setPassCodeInput('');
      setStatusMessage(`Pass redeemed! Active plan: ${data.planTier.toUpperCase()}`);
      setUser((prev) => (prev ? { ...prev, planTier: data.planTier } : prev));
    } else {
      setStatusMessage(data.message || 'Pass redemption failed.');
    }
  }

  async function toggleLabFlag(flagKey: string) {
    if (!user) return;
    const nextFlags = {
      ...user.labsFlags,
      [flagKey]: !user.labsFlags[flagKey],
    };
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labsFlags: nextFlags }),
    });
    if (res.ok) {
      setUser({ ...user, labsFlags: nextFlags });
      setStatusMessage('Labs feature updated.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a]">
      <header className="border-b border-[#e2e2d8] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <CortexLogo href="/app" subtitle="Account Settings" />
          <Link
            href="/app"
            className="px-3.5 py-1.5 rounded-md border border-[#d6d6cc] text-xs font-medium hover:bg-[#f4f4ee]"
          >
            ← Back to Workspace
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* Left Navigation */}
        <aside className="space-y-1">
          {(
            [
              { id: 'account', label: 'Account' },
              { id: 'access', label: 'Access & Passes' },
              { id: 'billing', label: 'My plan and billing' },
              { id: 'organizations', label: 'Organizations' },
              { id: 'api', label: 'API & Agent Connection' },
              { id: 'labs', label: 'Labs' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`w-full text-left px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
                tab === item.id
                  ? 'bg-[#1c1c1a] text-white'
                  : 'text-[#575751] hover:bg-[#f4f4ee] hover:text-[#1c1c1a]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>

        {/* Tab Body */}
        <section className="rounded-xl border border-[#e2e2d8] bg-white p-6 sm:p-8 shadow-sm">
          {statusMessage ? (
            <div className="mb-6 p-3 rounded-lg bg-[#0d9488]/10 border border-[#0d9488]/30 text-xs text-[#0d9488] font-medium">
              {statusMessage}
            </div>
          ) : null}

          {tab === 'account' ? (
            <div className="space-y-8">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                    Account Preferences
                  </h1>
                  <p className="text-xs text-[#575751] mt-1">
                    Manage your researcher profile, display language, and theme.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1c1c1a] mb-1">
                    Email (Verified via Invite Admission)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2 rounded-md border border-[#e2e2d8] bg-[#f4f4ee] text-sm text-[#575751]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-name"
                    className="block text-xs font-medium text-[#1c1c1a] mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    id="settings-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1c1c1a] mb-1">
                      Interface Language
                    </label>
                    <select
                      value={uiLanguage}
                      onChange={(e) => setUiLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d6d6cc] text-sm bg-white"
                    >
                      <option value="en">English</option>
                      <option value="ko">한국어</option>
                      <option value="ja">日本語</option>
                      <option value="zh-CN">简体中文</option>
                      <option value="zh-TW">繁體中文</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="pt-BR">Português (Brasil)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1c1c1a] mb-1">
                      Theme
                    </label>
                    <select
                      value={themePreference}
                      onChange={(e) => setThemePreference(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-[#d6d6cc] text-sm bg-white"
                    >
                      <option value="light">Warm Ivory (Light)</option>
                      <option value="dark">Obsidian Paper (Dark)</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
                >
                  Save changes
                </button>
              </form>

              {/* Danger Zone: Scheduled vs Immediate Account Deletion */}
              <div className="pt-6 border-t border-[#e2e2d8] space-y-3">
                <h2 className="text-sm font-semibold text-red-700">
                  Account Deletion & Retention
                </h2>
                <p className="text-xs text-[#575751]">
                  Schedule your account for deletion after a 14-day grace period, or cancel a scheduled deletion at any time.
                </p>
                {deleteScheduledAt ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                    <span className="text-amber-900">
                      Account deletion scheduled for {deleteScheduledAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteScheduledAt(null);
                        setStatusMessage('Scheduled account deletion cancelled.');
                      }}
                      className="px-3 py-1 rounded bg-[#1c1c1a] text-white font-medium"
                    >
                      Cancel scheduled deletion
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(Date.now() + 14 * 86400000)
                        .toISOString()
                        .slice(0, 10);
                      setDeleteScheduledAt(d);
                      setStatusMessage(`Account deletion scheduled for ${d}.`);
                    }}
                    className="px-3.5 py-1.5 rounded border border-red-300 text-red-700 text-xs font-medium hover:bg-red-50"
                  >
                    Schedule account deletion (14-day grace)
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {tab === 'access' ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  Access & Personal Passes
                </h1>
                <p className="text-xs text-[#575751] mt-1">
                  Redeem single-use or multi-use CorTeX Code Passes (`CTX-XXXX-XXXX-XXXX`) and inspect active entitlement grants.
                </p>
              </div>

              <form onSubmit={handleRedeemPass} className="p-5 rounded-xl border border-[#e2e2d8] bg-[#fafaf6] space-y-3">
                <h3 className="text-sm font-semibold text-[#1c1c1a]">
                  Redeem a Code Pass (`CTX-XXXX-XXXX-XXXX`)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="CTX-ABCD-EFGH-JKLM"
                    value={passCodeInput}
                    onChange={(e) => setPassCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-md border border-[#d6d6cc] font-mono-code text-xs uppercase bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium"
                  >
                    Redeem Pass
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {tab === 'organizations' ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  Organizations & Lab Seats
                </h1>
                <p className="text-xs text-[#575751] mt-1">
                  Manage research lab seats, member roles (`Owner`, `Admin`, `Member`), and 7-day member invitations.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!orgInviteEmail.trim()) return;
                  setOrgInvites((prev) => [
                    ...prev,
                    {
                      email: orgInviteEmail.trim(),
                      role: 'Member',
                      expiresIn: '7 days',
                    },
                  ]);
                  setOrgInviteEmail('');
                  setStatusMessage('Organization seat invitation created (valid for 7 days).');
                }}
                className="p-5 rounded-xl border border-[#e2e2d8] bg-[#fafaf6] space-y-3"
              >
                <div className="text-sm font-semibold text-[#1c1c1a]">
                  Invite Researcher to Organization Seat
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="colleague@university.edu"
                    value={orgInviteEmail}
                    onChange={(e) => setOrgInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-[#d6d6cc] text-xs bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium"
                  >
                    Send 7-Day Seat Invite
                  </button>
                </div>
              </form>

              {orgInvites.length > 0 ? (
                <div className="divide-y divide-[#e2e2d8] border border-[#e2e2d8] rounded-lg text-xs">
                  {orgInvites.map((inv, idx) => (
                    <div key={inv.email + idx} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#1c1c1a]">{inv.email}</span>
                        <span className="ml-2 text-[#8a8a80]">
                          {inv.role} · Expires in {inv.expiresIn}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setOrgInvites((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-red-700 hover:underline"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'billing' ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  My Plan, Quotas & Passes
                </h1>
                <p className="text-xs text-[#575751] mt-1">
                  Inspect your current plan tier, Orca AI token meters, and redeem
                  Personal or Code Passes.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-[#f4f4ee] border border-[#e2e2d8] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#8a8a80] uppercase font-semibold">
                    Current Plan Tier
                  </span>
                  <div className="text-lg font-bold text-[#1c1c1a] uppercase mt-1">
                    {user?.operatorGrantPlan || user?.planTier || 'free'}
                  </div>
                  <div className="text-[#575751]">System Role: {user?.role}</div>
                </div>
                <div>
                  <span className="text-[#8a8a80] uppercase font-semibold">
                    Daily Orca AI Tokens
                  </span>
                  <div className="text-lg font-bold text-[#1c1c1a] mt-1">
                    {(user?.dailyTokensUsed || 0).toLocaleString()} /{' '}
                    {(user?.dailyTokensLimit || 50000).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[#8a8a80] uppercase font-semibold">
                    Workspace Storage
                  </span>
                  <div className="text-lg font-bold text-[#1c1c1a] mt-1">
                    {Math.round((user?.storageBytesUsed || 0) / 1024)} KB / 500 MB
                  </div>
                </div>
              </div>

              <form onSubmit={handleRedeemPass} className="pt-4 border-t border-[#e2e2d8]">
                <h3 className="text-sm font-semibold text-[#1c1c1a]">
                  Redeem a Code Pass (`CTX-XXXX-XXXX-XXXX`)
                </h3>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="CTX-ABCD-EFGH-JKLM"
                    value={passCodeInput}
                    onChange={(e) => setPassCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-md border border-[#d6d6cc] font-mono-code text-xs uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium"
                  >
                    Redeem Pass
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {tab === 'api' || tab === 'api-key' ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  API Connection & Connected Local Agent
                </h1>
                <p className="text-xs text-[#575751] mt-1">
                  Connect your personal OpenAI API key (`sk-...`) or pair your local terminal agent (`Claude Code`, `Codex`, `Gemini CLI`) via `/connect`.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#e2e2d8] bg-[#fafaf6] flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-[#1c1c1a]">
                    Connected Local Agent Relay (`/connect`)
                  </div>
                  <div className="text-[#575751] mt-0.5">
                    Generate a short-lived SHA-256 verified relay script for your terminal agent.
                  </div>
                </div>
                <Link
                  href="/connect"
                  className="px-3.5 py-2 rounded-md bg-[#1c1c1a] text-white font-medium shrink-0 hover:bg-[#33332f]"
                >
                  Connect your agent →
                </Link>
              </div>

              <div className="p-4 rounded-lg bg-[#f4f4ee] border border-[#e2e2d8] flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#1c1c1a]">Status: </span>
                  {user?.hasOpenAiByok ? (
                    <span className="text-[#0d9488] font-semibold">
                      Connected ({user.openAiKeyHint})
                    </span>
                  ) : (
                    <span className="text-[#575751]">
                      Using CorTeX Managed Azure OpenAI Gateway
                    </span>
                  )}
                </div>
                {user?.hasOpenAiByok ? (
                  <button
                    type="button"
                    onClick={handleRemoveByok}
                    className="text-red-700 font-medium hover:underline"
                  >
                    Disconnect key
                  </button>
                ) : null}
              </div>

              <form onSubmit={handleSaveByok} className="space-y-3">
                <label
                  htmlFor="byok-input"
                  className="block text-xs font-medium text-[#1c1c1a]"
                >
                  OpenAI API Key (`sk-...`)
                </label>
                <input
                  id="byok-input"
                  type="password"
                  required
                  placeholder="sk-proj-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] font-mono-code text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium"
                >
                  Connect OpenAI Key
                </button>
              </form>
            </div>
          ) : null}

          {tab === 'labs' ? (
            <div className="space-y-5">
              <div>
                <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
                  CorTeX Labs
                </h1>
                <p className="text-xs text-[#575751] mt-1">
                  Opt in to experimental academic authoring and compilation features.
                </p>
              </div>

              {[
                {
                  key: 'continuousTypst',
                  title: 'Sub-10ms Incremental Typst Compilation',
                  desc: 'Stream AST diffs directly to the preview sheet on every keystroke.',
                },
                {
                  key: 'autoCiteVerify',
                  title: 'Live Crossref / OpenAlex DOI Verification',
                  desc: 'Automatically verify DOIs and arXiv preprints added to refs.bib.',
                },
                {
                  key: 'orcaInlineGhost',
                  title: 'Orca AI Equation & Proof Auto-Completion',
                  desc: 'Show ghost-text completions inside align and theorem environments.',
                },
              ].map((item) => {
                const enabled = Boolean(user?.labsFlags?.[item.key]);
                return (
                  <div
                    key={item.key}
                    className="p-4 rounded-lg border border-[#e2e2d8] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#1c1c1a]">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#575751] mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLabFlag(item.key)}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        enabled
                          ? 'bg-[#0d9488] text-white'
                          : 'bg-[#f4f4ee] text-[#575751]'
                      }`}
                    >
                      {enabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
