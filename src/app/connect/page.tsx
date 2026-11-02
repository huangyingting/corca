'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Unplug,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface AgentStatusResponse {
  state: 'unpaired' | 'pairing' | 'connected';
  pairingExpiresAt?: string;
  connectedAt?: string;
  activity?: 'idle' | 'busy' | 'offline';
  lastSeenAt?: string;
  plan?: string;
}

interface PairingHandoff {
  script: string;
  expiresAt: string;
  relaySha256: string;
}

function ConnectAgentContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const safeReturnTo =
    returnTo && returnTo.startsWith('/app/') && !returnTo.startsWith('//') ? returnTo : null;

  const [status, setStatus] = useState<AgentStatusResponse | null>(null);
  const [handoff, setHandoff] = useState<PairingHandoff | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/connected-agent', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to connect a local agent to your CorTeX account.');
        } else {
          setError('Could not load connected-agent status.');
        }
        return;
      }
      const data = (await res.json()) as AgentStatusResponse;
      setStatus(data);
      if (data.state === 'connected') {
        setHandoff(null);
      }
      setError(null);
    } catch {
      setError('Could not load connected-agent status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 4000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  async function handleStartPairing() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/connected-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start agent pairing.');
        return;
      }
      setHandoff({
        script: data.script,
        expiresAt: data.expiresAt,
        relaySha256: data.relaySha256,
      });
      setStatus({
        state: 'pairing',
        pairingExpiresAt: data.expiresAt,
      });
    } catch {
      setError('Could not start agent pairing.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulateConnect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/connected-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', activity: 'idle' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setHandoff(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/connected-agent', { method: 'DELETE' });
      if (res.ok) {
        setStatus({ state: 'unpaired' });
        setHandoff(null);
      }
    } catch {
      setError('Could not disconnect agent.');
    } finally {
      setBusy(false);
    }
  }

  const agentPromptText = handoff
    ? `Please connect this terminal agent to my CorTeX workspace by running this one-time relay script in bash and keeping it running until I stop it:\n\n\`\`\`bash\n${handoff.script}\n\`\`\``
    : '';

  async function handleCopyPrompt() {
    if (!agentPromptText) return;
    await navigator.clipboard.writeText(agentPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#14181f]">
      <header className="border-b border-[#dde2ea] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="flex items-center gap-2 text-sm font-semibold text-[#14181f] hover:text-[#1e3a6e]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#1e3a6e] text-xs font-bold text-white">
                C
              </span>
              CorTeX
            </Link>
            <span className="text-[#dde2ea]">/</span>
            <span className="text-sm text-[#525a65]">Connect your agent</span>
          </div>
          <div className="flex items-center gap-2">
            {safeReturnTo ? (
              <Link
                href={safeReturnTo}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] bg-white px-3 py-1.5 text-xs font-medium text-[#14181f] hover:bg-[#f1f4f8]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to project
              </Link>
            ) : (
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] bg-white px-3 py-1.5 text-xs font-medium text-[#14181f] hover:bg-[#f1f4f8]"
              >
                Open workspace
              </Link>
            )}
            <Link
              href="/app/settings/api-key"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#525a65] hover:bg-[#f1f4f8] hover:text-[#14181f]"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3fc] px-2.5 py-1 text-xs font-medium text-[#1e3a6e]">
            <Terminal className="h-3.5 w-3.5" />
            Connected Local Agent Relay
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#14181f]">
            Connect your agent
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[#525a65]">
            Use CorTeX&apos;s own interface while AI work runs on an agent on your computer.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-[#b33232]/30 bg-[#fdecec] px-4 py-3 text-sm text-[#b33232]"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-lg border border-[#dde2ea] bg-white p-6 text-sm text-[#525a65]">
            Checking agent connection...
          </div>
        ) : (
          <ol className="mt-8 divide-y divide-[#dde2ea] rounded-lg border border-[#dde2ea] bg-white shadow-xs">
            {/* Step 1 */}
            <li className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dde2ea] bg-[#f8f9fb] text-xs font-semibold text-[#525a65]">
                    1
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#14181f]">
                      Create connection script
                    </h2>
                    <p className="mt-1 text-sm text-[#525a65]">
                      Create a short-lived connection script for this account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleStartPairing}
                  data-testid="create-agent-script-btn"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#1e3a6e] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#162d57] disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
                  {handoff ? 'Replace connection script' : 'Create connection script'}
                </button>
              </div>
            </li>

            {/* Step 2 */}
            <li className="p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dde2ea] bg-[#f8f9fb] text-xs font-semibold text-[#525a65]">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-[#14181f]">
                        Paste into your agent
                      </h2>
                      <p className="mt-1 text-sm text-[#525a65]">
                        Give this message to the agent you already run in your terminal.
                      </p>
                    </div>
                    {handoff && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyPrompt}
                          data-testid="copy-agent-script-btn"
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#1e3a6e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162d57]"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy for agent
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleSimulateConnect}
                          disabled={busy}
                          data-testid="confirm-agent-connection-btn"
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] bg-white px-3 py-1.5 text-xs font-medium text-[#14181f] hover:bg-[#f1f4f8]"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#3564b3]" />
                          Verify local relay
                        </button>
                      </div>
                    )}
                  </div>

                  {handoff && (
                    <div className="mt-3 space-y-2.5">
                      <pre
                        data-testid="agent-prompt-box"
                        className="max-h-56 overflow-auto rounded-md border border-[#dde2ea] bg-[#f8f9fb] p-3 font-mono text-xs leading-5 text-[#14181f]"
                      >
                        {agentPromptText}
                      </pre>
                      <details className="rounded-md border border-[#dde2ea] px-3 py-2 text-xs text-[#525a65]">
                        <summary className="cursor-pointer font-medium text-[#14181f]">
                          Show script only
                        </summary>
                        <pre className="mt-2 max-h-44 overflow-auto rounded bg-[#f8f9fb] p-2.5 font-mono text-xs leading-5 text-[#14181f]">
                          {handoff.script}
                        </pre>
                      </details>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#525a65]">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <ShieldCheck className="h-3.5 w-3.5 text-[#2b7032]" />
                          Relay SHA-256: {handoff.relaySha256.slice(0, 24)}…
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Valid until {new Date(handoff.expiresAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>

            {/* Step 3 */}
            <li className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dde2ea] bg-[#f8f9fb] text-xs font-semibold text-[#525a65]">
                    3
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#14181f]">
                        Keep the terminal open
                      </h2>
                      <span
                        data-testid="connected-agent-status-badge"
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          status?.state === 'connected'
                            ? 'bg-[#e8f5e9] text-[#2b7032]'
                            : status?.state === 'pairing'
                            ? 'bg-[#fff8e6] text-[#855500]'
                            : 'bg-[#f1f4f8] text-[#525a65]'
                        }`}
                      >
                        {status?.state === 'connected' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            {status.activity === 'busy' ? 'Working' : 'Connected'}
                          </>
                        ) : status?.state === 'pairing' ? (
                          'Waiting for your agent'
                        ) : (
                          'Not connected'
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#525a65]">
                      {status?.state === 'connected'
                        ? 'Your agent is connected to CorTeX. Keep the relay process running while you work.'
                        : 'Once the script connects, this page updates automatically.'}
                    </p>
                    {status?.connectedAt && (
                      <p className="mt-1 text-xs text-[#525a65]">
                        Connected {new Date(status.connectedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {status?.state === 'connected' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDisconnect}
                    data-testid="disconnect-agent-btn"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] bg-white px-3 py-1.5 text-xs font-medium text-[#b33232] hover:bg-[#fdecec]"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    Disconnect agent
                  </button>
                )}
              </div>
            </li>
          </ol>
        )}
      </main>
    </div>
  );
}

export default function ConnectAgentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#525a65]">Loading agent connection…</div>}>
      <ConnectAgentContent />
    </Suspense>
  );
}
