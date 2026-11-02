'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Sign in failed.');
        setLoading(false);
        return;
      }
      router.push('/app');
      router.refresh();
    } catch {
      setError('Unable to reach authentication service.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fcfcf9] text-[#1c1c1a]">
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <CortexLogo />
        <div className="flex items-center gap-3 text-xs">
          <Link href="/try" className="text-[#575751] hover:text-[#1c1c1a]">
            Try in browser
          </Link>
          <Link
            href="/redeem"
            className="px-3 py-1.5 rounded-md border border-[#d6d6cc] bg-white font-medium text-[#1c1c1a] hover:bg-[#f4f4ee]"
          >
            Redeem Invitation / Pass
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[#e2e2d8] bg-white p-8 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f4f4ee] border border-[#e2e2d8] text-[11px] font-medium text-[#575751]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]" />
              Invite-Only Research Workspace
            </span>
            <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a] mt-3">
              Sign in to CorTeX
            </h1>
            <p className="text-xs text-[#575751] mt-1">
              Enter your registered academic credentials. New accounts require a single-use
              invitation link or an active Code Pass.
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-[#1c1c1a] mb-1.5"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] text-sm focus:outline-none focus:border-[#1c1c1a]"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-[#1c1c1a] mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] text-sm focus:outline-none focus:border-[#1c1c1a]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-[#1c1c1a] text-white text-sm font-medium hover:bg-[#33332f] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#e2e2d8] space-y-2.5 text-xs text-[#575751]">
            <div className="flex items-center justify-between">
              <span>Have a Code Pass (`CTX-XXXX-...`)?</span>
              <Link href="/redeem" className="font-semibold text-[#0d9488] hover:underline">
                Redeem & register →
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Want to explore without an account?</span>
              <Link href="/try" className="font-medium text-[#1c1c1a] hover:underline">
                Open browser trial →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#8a8a80]">
        © {new Date().getFullYear()} Corca Inc. ·{' '}
        <Link href="/legal/en/terms" className="hover:underline">
          Terms
        </Link>{' '}
        ·{' '}
        <Link href="/legal/en/privacy" className="hover:underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
