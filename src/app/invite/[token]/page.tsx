'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';

export default function AcceptInvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token || '';

  const [loadingInfo, setLoadingInfo] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    role: string;
    planTier: string;
    expiresAt: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/invitation?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'This invitation link is invalid or has expired.');
        } else {
          setInviteInfo(data.invitation);
        }
      })
      .catch(() => setError('Failed to verify invitation token.'))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteInfo) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationToken: token,
          email: inviteInfo.email,
          name,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Could not complete registration.');
        setSubmitting(false);
        return;
      }
      router.push('/app');
      router.refresh();
    } catch {
      setError('Network error while registering account.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fcfcf9] text-[#1c1c1a]">
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <CortexLogo subtitle="Invitation Admission" />
        <Link href="/login" className="text-xs font-medium text-[#575751] hover:text-[#1c1c1a]">
          Sign in instead
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[#e2e2d8] bg-white p-8 shadow-sm">
          <h1 className="font-serif-academic text-2xl font-semibold text-[#1c1c1a]">
            Accept your CorTeX invitation
          </h1>

          {loadingInfo ? (
            <p className="text-xs text-[#575751] mt-4">Verifying single-use token...</p>
          ) : error && !inviteInfo ? (
            <div className="mt-4 space-y-4">
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
              >
                {error}
              </div>
              <Link
                href="/redeem"
                className="inline-block text-xs font-semibold text-[#0d9488] hover:underline"
              >
                Have a Code Pass instead? Redeem here →
              </Link>
            </div>
          ) : inviteInfo ? (
            <form onSubmit={handleAccept} className="mt-5 space-y-4">
              {error ? (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
                >
                  {error}
                </div>
              ) : null}

              <div className="p-3.5 rounded-lg bg-[#f4f4ee] border border-[#e2e2d8] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#575751]">Invited Email:</span>
                  <span className="font-semibold text-[#1c1c1a]">{inviteInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575751]">Assigned Role:</span>
                  <span className="font-semibold text-[#0d9488]">{inviteInfo.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575751]">Plan Tier:</span>
                  <span className="font-semibold uppercase text-[#1c1c1a]">
                    {inviteInfo.planTier}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="inv-name"
                  className="block text-xs font-medium text-[#1c1c1a] mb-1"
                >
                  Full name
                </label>
                <input
                  id="inv-name"
                  type="text"
                  required
                  placeholder="Dr. Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md border border-[#d6d6cc] text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="inv-password"
                  className="block text-xs font-medium text-[#1c1c1a] mb-1"
                >
                  Create password (min. 8 chars, letters & numbers)
                </label>
                <input
                  id="inv-password"
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
                disabled={submitting}
                className="w-full py-2.5 rounded-md bg-[#1c1c1a] text-white text-sm font-medium hover:bg-[#33332f] disabled:opacity-50"
              >
                {submitting ? 'Activating account...' : 'Accept invitation & enter workspace'}
              </button>
            </form>
          ) : null}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#8a8a80]">
        Single-use cryptographic invitation token · CorTeX Security
      </footer>
    </div>
  );
}
