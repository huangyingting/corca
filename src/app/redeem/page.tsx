'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';

export default function RedeemPassPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          email,
          name,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Pass redemption failed.');
        setLoading(false);
        return;
      }
      router.push('/app');
      router.refresh();
    } catch {
      setError('Unable to reach redemption service.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fcfcf9] text-[#1c1c1a]">
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <CortexLogo subtitle="Pass Redemption" />
        <Link href="/login" className="text-xs font-medium text-[#575751] hover:text-[#1c1c1a]">
          Already have an account? Sign in →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[#e2e2d8] bg-white p-8 shadow-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f4f4ee] border border-[#e2e2d8] text-[11px] font-medium text-[#575751]">
            Single-Use & Institutional Pass Admission
          </span>
          <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a] mt-3">
            Redeem a CorTeX Code Pass
          </h1>
          <p className="text-xs text-[#575751] mt-1">
            Enter your single-use or institutional Code Pass (`CTX-XXXX-XXXX-XXXX`) to
            register a new account or upgrade your plan tier.
          </p>

          {error ? (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="pass-code"
                className="block text-xs font-medium text-[#1c1c1a] mb-1"
              >
                Code Pass
              </label>
              <input
                id="pass-code"
                type="text"
                required
                placeholder="CTX-ABCD-EFGH-JKLM"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] font-mono-code text-sm uppercase tracking-wider focus:outline-none focus:border-[#1c1c1a]"
              />
            </div>

            <div>
              <label
                htmlFor="redeem-name"
                className="block text-xs font-medium text-[#1c1c1a] mb-1"
              >
                Full name
              </label>
              <input
                id="redeem-name"
                type="text"
                required
                placeholder="Prof. Richard Feynman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="redeem-email"
                className="block text-xs font-medium text-[#1c1c1a] mb-1"
              >
                Academic email
              </label>
              <input
                id="redeem-email"
                type="email"
                required
                placeholder="researcher@caltech.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="redeem-password"
                className="block text-xs font-medium text-[#1c1c1a] mb-1"
              >
                Password (min. 8 characters, letters & numbers)
              </label>
              <input
                id="redeem-password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-[#1c1c1a] text-white text-sm font-medium hover:bg-[#33332f] disabled:opacity-50"
            >
              {loading ? 'Redeeming pass...' : 'Redeem pass & create account'}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#8a8a80]">
        CorTeX Invite-Only Access Control · Audited Pass Redemption
      </footer>
    </div>
  );
}
