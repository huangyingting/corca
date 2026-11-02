import React from 'react';
import Link from 'next/link';
import { CortexLogo } from '@/components/CortexLogo';

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  const isKo = locale === 'ko';
  const isPrivacy = doc === 'privacy';

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a]">
      <header className="border-b border-[#e2e2d8] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <CortexLogo subtitle="Legal & Governance" />
          <div className="flex items-center gap-3 text-xs">
            <Link
              href={`/legal/en/${doc}`}
              className={`px-2.5 py-1 rounded ${
                !isKo ? 'bg-[#1c1c1a] text-white' : 'bg-[#f4f4ee] text-[#575751]'
              }`}
            >
              English
            </Link>
            <Link
              href={`/legal/ko/${doc}`}
              className={`px-2.5 py-1 rounded ${
                isKo ? 'bg-[#1c1c1a] text-white' : 'bg-[#f4f4ee] text-[#575751]'
              }`}
            >
              한국어
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 text-xs font-medium text-[#575751] mb-6">
          <Link
            href={`/legal/${locale}/terms`}
            className={`px-3 py-1.5 rounded-md ${
              !isPrivacy ? 'bg-[#1c1c1a] text-white' : 'bg-[#f4f4ee]'
            }`}
          >
            {isKo ? '서비스 이용약관 (Terms)' : 'Terms of Service'}
          </Link>
          <Link
            href={`/legal/${locale}/privacy`}
            className={`px-3 py-1.5 rounded-md ${
              isPrivacy ? 'bg-[#1c1c1a] text-white' : 'bg-[#f4f4ee]'
            }`}
          >
            {isKo ? '개인정보 처리방침 (Privacy)' : 'Privacy Policy'}
          </Link>
        </div>

        <article className="p-8 rounded-xl border border-[#e2e2d8] bg-white space-y-6">
          <h1 className="font-serif-academic text-3xl font-semibold text-[#1c1c1a]">
            {isPrivacy
              ? isKo
                ? 'CorTeX 개인정보 처리방침'
                : 'CorTeX Privacy Policy'
              : isKo
                ? 'CorTeX 서비스 이용약관'
                : 'CorTeX Terms of Service'}
          </h1>
          <p className="text-xs text-[#8a8a80]">
            Effective Date: April 1, 2026 · Corca Inc. (support@corca.ai)
          </p>

          {isPrivacy ? (
            <div className="space-y-4 text-sm text-[#575751] leading-relaxed">
              <p>
                {isKo
                  ? 'CorTeX by Corca는 연구자의 미발표 논문 원고, 서지 라이브러리, 주석 데이터를 철저히 보호합니다. 당사는 사용자의 비공개 연구 원고를 외부 AI 모델 학습에 절대 사용하지 않습니다.'
                  : 'CorTeX by Corca is built to protect unpublished scholarly manuscripts, bibliography collections, and research annotations. We never train foundation models on your private manuscripts.'}
              </p>
              <h2 className="text-base font-semibold text-[#1c1c1a]">
                1. Data Collection & Invite-Only Admission Audit
              </h2>
              <p>
                We store account admission records (invitation tokens, pass redemptions,
                system role assignments, and security audit logs) strictly for workspace
                authorization and institutional compliance.
              </p>
              <h2 className="text-base font-semibold text-[#1c1c1a]">
                2. Bring Your Own Key (BYOK) & Encryption
              </h2>
              <p>
                When you configure a personal OpenAI API key in Account Settings, the key
                is used exclusively to service your explicit Orca AI requests and can be
                revoked at any time.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-[#575751] leading-relaxed">
              <p>
                {isKo
                  ? '본 약관은 Corca Inc.가 제공하는 CorTeX 학술 연구 및 집필 플랫폼의 이용 조건과 연구자 권리를 규정합니다.'
                  : 'These Terms govern your access to the CorTeX academic writing, typesetting, and research library platform operated by Corca Inc.'}
              </p>
              <h2 className="text-base font-semibold text-[#1c1c1a]">
                1. Intellectual Property of Manuscripts
              </h2>
              <p>
                You retain 100% ownership and copyright over all LaTeX, Typst, Markdown,
                slides, figures, and bibliography files created or uploaded to CorTeX.
              </p>
              <h2 className="text-base font-semibold text-[#1c1c1a]">
                2. Invite-Only Access, Passes & Role Governance
              </h2>
              <p>
                Account registration requires a valid single-use email invitation or an
                active CorTeX Code Pass (`CTX-XXXX-XXXX-XXXX`). System operators may
                revoke compromised passes or sessions with immediate effect.
              </p>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
