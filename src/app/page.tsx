'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CortexLogo } from '@/components/CortexLogo';

type FormatKey = 'tex' | 'typ' | 'md' | 'slides';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
] as const;

const HERO_TRANSLATIONS: Record<
  string,
  { badge: string; headline: string; subhead: string; tryBtn: string; galleryBtn: string }
> = {
  en: {
    badge: 'CorTeX by Corca · Academic Research Workspace',
    headline: 'Built for scholars, designed for research.',
    subhead:
      'Write in LaTeX, Typst, Markdown, and Slides with an integrated research library, verified BibTeX citations, and AI-assisted academic revisions.',
    tryBtn: 'Try in browser',
    galleryBtn: 'Explore gallery',
  },
  ko: {
    badge: 'CorTeX by Corca · 연구자를 위한 학술 워크스페이스',
    headline: '학자를 위해 설계된 통합 연구 및 집필 환경.',
    subhead:
      'LaTeX, Typst, Markdown, 발표 슬라이드를 하나의 워크스페이스에서 작성하고 서지 라이브러리와 Orca AI로 연구 생산성을 높이세요.',
    tryBtn: '브라우저에서 체험하기',
    galleryBtn: '오픈 갤러리 탐색',
  },
  ja: {
    badge: 'CorTeX by Corca · 学術研究ワークスペース',
    headline: '研究者のために設計された執筆・文献統合環境。',
    subhead:
      'LaTeX、Typst、Markdown、スライド作成から文献管理・Orca AIによる推敲までを一つの環境で完結。',
    tryBtn: 'ブラウザで試す',
    galleryBtn: 'ギャラリーを見る',
  },
};

const FORMAT_PREVIEWS: Record<
  FormatKey,
  {
    label: string;
    file: string;
    badge: string;
    tryHref: string;
    source: string;
    previewTitle: string;
    previewSubtitle: string;
    previewEquation: string;
    previewBody: string;
  }
> = {
  tex: {
    label: 'LaTeX',
    file: 'main.tex',
    badge: 'pdflatex + SyncTeX',
    tryHref: '/try/tex',
    source: `\\documentclass[11pt]{article}
\\usepackage{amsmath,amssymb,booktabs}
\\title{Sparse Spectral Attention on Riemannian Manifolds}
\\author{Research Group \\cdot CorTeX Lab}

\\begin{document}
\\maketitle
\\begin{abstract}
We establish tight spectral bounds for geodesic attention kernels.
\\end{abstract}

\\section{Main Theorem}
For any compact manifold $(\\mathcal{M}, g)$ with heat kernel $K_t(x,y)$:
\\begin{equation}
  \\|\\mathcal{A}_t f - f\\|_{L^2(\\mathcal{M})} \\le C \\, t \\, \\|\\Delta_g f\\|_{L^2(\\mathcal{M})}.
\\end{equation}
See \\cite{vaswani2017attention,dao2022flashattention} for empirical baselines.
\\end{document}`,
    previewTitle: 'Sparse Spectral Attention on Riemannian Manifolds',
    previewSubtitle: 'Research Group · CorTeX Lab',
    previewEquation: '|| A_t f − f ||_{L²(M)} ≤ C · t · || Δ_g f ||_{L²(M)}   (1)',
    previewBody:
      'We establish tight spectral bounds for geodesic attention kernels on compact manifolds. Empirical baselines follow [vaswani2017attention, dao2022flashattention].',
  },
  typ: {
    label: 'Typst',
    file: 'main.typ',
    badge: 'typst 0.12 incremental',
    tryHref: '/try/typ',
    source: `#set page(paper: "us-letter", margin: 2.2cm)
#set text(font: "New Computer Modern", size: 11pt)

= Compositional Type Systems for Differentiable Programs

*Abstract.* We present a modal linear type discipline that tracks reverse-mode AD tape lifetimes statically.

== Soundness & Progress
Let $Gamma |- e : tau$ denote a well-typed differentiable term:
$ nabla_x cal(L)(x) = J_f (x)^top (1) $`,
    previewTitle: 'Compositional Type Systems for Differentiable Programs',
    previewSubtitle: 'Incremental Typst Preview · Sub-millisecond layout',
    previewEquation: '∇_x L(x) = J_f(x)^T · (1)',
    previewBody:
      'We present a modal linear type discipline that tracks reverse-mode automatic differentiation tape lifetimes statically without runtime overhead.',
  },
  md: {
    label: 'Markdown',
    file: 'notes.md',
    badge: 'Scholarly Markdown + KaTeX',
    tryHref: '/try/md',
    source: `# Literature Synthesis: Retrieval-Augmented Scientific Reasoning

## Core Hypothesis
Coupling **executable symbolic verifiers** with dense citation retrieval reduces unsupported factual claims by **64.2%** across graduate benchmarks.

$$\\mathcal{R}_{\\text{verified}}(q) = \\sum_{d \\in \\mathcal{D}_k(q)} p(d \\mid q) \\cdot \\mathbb{I}[\\text{entails}(d, y)]$$

- Direct sync with CorTeX Library highlights
- One-click export to NeurIPS / ACL LaTeX templates`,
    previewTitle: 'Literature Synthesis: Retrieval-Augmented Scientific Reasoning',
    previewSubtitle: 'Research Note · Linked to 14 Library PDFs',
    previewEquation: 'R_verified(q) = Σ_{d ∈ D_k(q)} p(d | q) · I[entails(d, y)]',
    previewBody:
      'Coupling executable symbolic verifiers with dense citation retrieval reduces unsupported factual claims by 64.2% across graduate benchmarks.',
  },
  slides: {
    label: 'Presentation',
    file: 'slides.md',
    badge: '16:9 Academic Deck',
    tryHref: '/try/slides',
    source: `---
title: Lab Group Seminar — Spectral Graph Transformers
theme: cortex-ivory
---

# Slide 1: Motivation & Bottlenecks
- Quadratic memory in full token-to-token attention
- Positional encodings fail on irregular meshes

---

# Slide 2: Geodesic Kernel Approximation
$$K_t(x, y) \\approx (4\\pi t)^{-d/2} \\exp\\left(-\\frac{d_g(x,y)^2}{4t}\\right)$$
- Linear complexity in mesh edges $|E|$`,
    previewTitle: 'Slide 2 · Geodesic Kernel Approximation',
    previewSubtitle: 'Lab Group Seminar — Spectral Graph Transformers (16:9)',
    previewEquation: 'K_t(x, y) ≈ (4πt)^(-d/2) exp( − d_g(x,y)² / 4t )',
    previewBody:
      'Linear complexity in mesh edges |E| with provable spectral convergence on non-Euclidean domains.',
  },
};

export default function LandingPage() {
  const [lang, setLang] = useState<string>('en');
  const [activeFormat, setActiveFormat] = useState<FormatKey>('tex');

  const t = HERO_TRANSLATIONS[lang] || HERO_TRANSLATIONS.en;
  const activePreview = FORMAT_PREVIEWS[activeFormat];

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a]">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#e2e2d8] bg-[#fcfcf9]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-7">
            <CortexLogo />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#575751]">
              <Link href="/gallery" className="hover:text-[#1c1c1a] transition-colors">
                Open workspace
              </Link>
              <Link href="/docs/en" className="hover:text-[#1c1c1a] transition-colors">
                Documentation
              </Link>
              <a href="#pricing" className="hover:text-[#1c1c1a] transition-colors">
                Pricing
              </a>
              <Link
                href="/docs/en/guides/latex-for-beginners"
                className="hover:text-[#1c1c1a] transition-colors"
              >
                LaTeX guide
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="lang-select" className="sr-only">
              Language
            </label>
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-xs bg-white border border-[#e2e2d8] rounded-md px-2.5 py-1.5 text-[#575751] focus:outline-none focus:border-[#1c1c1a]"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>

            <Link
              href="/redeem"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-[#575751] hover:text-[#1c1c1a] border border-transparent hover:border-[#e2e2d8] rounded-md"
            >
              Redeem pass
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-sm font-medium text-[#1c1c1a] hover:bg-[#f4f4ee] rounded-md transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="px-4 py-1.5 text-sm font-medium bg-[#1c1c1a] text-white rounded-md hover:bg-[#33332f] transition-colors shadow-sm"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f4ee] border border-[#e2e2d8] text-xs font-medium text-[#575751] mb-5">
              <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
              <span>{t.badge}</span>
            </div>
            <h1 className="font-serif-academic text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight leading-[1.1] text-[#1c1c1a]">
              {t.headline}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#575751] leading-relaxed max-w-2xl">
              {t.subhead}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/try"
                className="px-5 py-2.5 rounded-md bg-[#1c1c1a] text-white text-sm font-medium hover:bg-[#33332f] transition-colors shadow-sm"
              >
                {t.tryBtn} →
              </Link>
              <Link
                href="/gallery"
                className="px-5 py-2.5 rounded-md bg-white border border-[#d6d6cc] text-[#1c1c1a] text-sm font-medium hover:bg-[#f4f4ee] transition-colors"
              >
                {t.galleryBtn}
              </Link>
              <Link
                href="/try/tex?tour=1"
                className="px-4 py-2.5 text-xs font-medium text-[#0d9488] hover:underline"
              >
                Interactive 5-step tour
              </Link>
            </div>
          </div>

          {/* Interactive 4-Format Workspace Switcher */}
          <div className="mt-12 rounded-xl border border-[#d8d8ce] bg-white shadow-lg overflow-hidden">
            <div className="bg-[#f4f4ee] border-b border-[#e2e2d8] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {(Object.keys(FORMAT_PREVIEWS) as FormatKey[]).map((key) => {
                  const item = FORMAT_PREVIEWS[key];
                  const isActive = activeFormat === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFormat(key)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#1c1c1a] text-white shadow-sm'
                          : 'text-[#575751] hover:text-[#1c1c1a] hover:bg-[#eaeae2]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs text-[#575751]">
                <span className="font-mono-code bg-white border border-[#e2e2d8] px-2.5 py-0.5 rounded">
                  {activePreview.file}
                </span>
                <span className="hidden sm:inline text-[#8a8a80]">
                  {activePreview.badge}
                </span>
                <Link
                  href={activePreview.tryHref}
                  className="text-[#0d9488] font-medium hover:underline"
                >
                  Open {activePreview.label} in browser →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e2e2d8]">
              {/* Left: Source Editor */}
              <div className="p-5 bg-[#fafaf6]">
                <div className="flex items-center justify-between text-xs text-[#8a8a80] mb-3 font-mono-code">
                  <span>&lt;/&gt; SOURCE EDITOR · {activePreview.file}</span>
                  <span>UTF-8 · SyncTeX active</span>
                </div>
                <pre className="font-mono-code text-xs sm:text-[13px] leading-relaxed text-[#1c1c1a] whitespace-pre-wrap overflow-x-auto">
                  {activePreview.source}
                </pre>
              </div>

              {/* Right: Typeset Output */}
              <div className="p-6 bg-[#f4f4ee] flex flex-col justify-center">
                <div className="cortex-paper-sheet">
                  <div className="cortex-paper-header">
                    <h2 className="cortex-paper-title">{activePreview.previewTitle}</h2>
                    <div className="cortex-paper-authors">
                      {activePreview.previewSubtitle}
                    </div>
                  </div>
                  <div className="cortex-math-block">{activePreview.previewEquation}</div>
                  <p className="cortex-p">{activePreview.previewBody}</p>
                  <div className="mt-4 pt-3 border-t border-[#ecece4] flex items-center justify-between text-xs font-sans text-[#575751]">
                    <span>Orca AI: 0 unresolved citations · Ready to export PDF</span>
                    <Link
                      href={activePreview.tryHref}
                      className="text-[#0d9488] font-medium hover:underline"
                    >
                      Edit live →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7 Feature Sections */}
        <section className="border-t border-[#e2e2d8] bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0d9488]">
                Architecture & Capabilities
              </p>
              <h2 className="font-serif-academic text-3xl font-semibold mt-2 text-[#1c1c1a]">
                Seven pillars of the CorTeX research environment
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  num: '01',
                  title: 'Multiple document formats',
                  desc: 'First-class compilation for LaTeX (.tex), Typst (.typ), Scholarly Markdown (.md), Presentation decks, BibTeX (.bib), and DOCX imports in a single project tree.',
                },
                {
                  num: '02',
                  title: 'Integrated research library',
                  desc: 'Manage PDFs, DOIs, and OpenAlex papers alongside your manuscripts. Highlight passages, attach sticky notes, and insert verified \\cite{key} references in one click.',
                },
                {
                  num: '03',
                  title: 'Designed for focused writing',
                  desc: 'Switch effortlessly between Visual outline mode, Source code with / academic phrasebank completions, and SyncTeX-linked live preview.',
                },
                {
                  num: '04',
                  title: 'AI-assisted writing with Orca',
                  desc: 'Context-aware scientific co-authoring powered by GPT-4o or your own BYOK OpenAI key. Inspect structured line-by-line diffs before accepting any edit.',
                },
                {
                  num: '05',
                  title: 'Built for research teams',
                  desc: 'Fine-grained RBAC collaboration across whole projects, specific folders, or single files with Owner, Editor, Commenter, and Viewer permissions.',
                },
                {
                  num: '06',
                  title: 'Private by design',
                  desc: 'Invite-only admission with single-use expiring tokens, cryptographic code passes, immediate session revocation, and zero training on your unpublished manuscripts.',
                },
              ].map((feat) => (
                <div
                  key={feat.num}
                  className="p-6 rounded-xl border border-[#e2e2d8] bg-[#fcfcf9] flex flex-col justify-between"
                >
                  <div>
                    <span className="font-mono-code text-xs font-semibold text-[#0d9488]">
                      {feat.num}
                    </span>
                    <h3 className="text-lg font-semibold text-[#1c1c1a] mt-2">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-[#575751] mt-2 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="border-t border-[#e2e2d8] py-16 bg-[#fcfcf9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-serif-academic text-3xl font-semibold text-[#1c1c1a] mb-8">
              How CorTeX compares to legacy tools
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[#e2e2d8] bg-white">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e2e2d8] bg-[#f4f4ee] text-[#1c1c1a]">
                    <th className="py-3.5 px-4 font-semibold">Capability</th>
                    <th className="py-3.5 px-4 font-semibold text-[#0d9488]">
                      CorTeX by Corca
                    </th>
                    <th className="py-3.5 px-4 font-medium text-[#575751]">Overleaf</th>
                    <th className="py-3.5 px-4 font-medium text-[#575751]">
                      SciSpace / Typeset
                    </th>
                    <th className="py-3.5 px-4 font-medium text-[#575751]">
                      Word / Google Docs
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e2d8]">
                  {[
                    [
                      'Native LaTeX + Typst + Markdown + Slides',
                      '✓ All 4 formats unified',
                      'LaTeX only',
                      'Proprietary blocks',
                      'Word processor only',
                    ],
                    [
                      '104 Official Academic Venue Templates',
                      '✓ NeurIPS, ICML, IEEE, ACM, Nature',
                      'Community uploads',
                      'Partial',
                      'Manual formatting',
                    ],
                    [
                      'Integrated PDF Reader + Highlighting + BibTeX Sync',
                      '✓ Built-in 3-pane library',
                      'External Zotero/Mendeley required',
                      'Separate PDF tab',
                      'Plugin required',
                    ],
                    [
                      'Orca AI Diff Proposals + BYOK OpenAI Key',
                      '✓ Full diff inspection + BYOK',
                      'Paid add-on only',
                      'Opaque rewrites',
                      'Generic assistant',
                    ],
                    [
                      'Folder & Single-File Scoped Sharing',
                      '✓ Project / Folder / File RBAC',
                      'Whole project only',
                      'Whole document only',
                      'Whole document only',
                    ],
                  ].map(([cap, cortex, overleaf, scispace, word]) => (
                    <tr key={cap} className="hover:bg-[#fafaf6]">
                      <td className="py-3 px-4 font-medium text-[#1c1c1a]">{cap}</td>
                      <td className="py-3 px-4 font-semibold text-[#1c1c1a] bg-[#0d9488]/5">
                        {cortex}
                      </td>
                      <td className="py-3 px-4 text-[#575751]">{overleaf}</td>
                      <td className="py-3 px-4 text-[#575751]">{scispace}</td>
                      <td className="py-3 px-4 text-[#575751]">{word}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="border-t border-[#e2e2d8] bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0d9488]">
                07 · Simple, fair pricing
              </p>
              <h2 className="font-serif-academic text-3xl font-semibold mt-2 text-[#1c1c1a]">
                Plans for individual scholars and research labs
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Free Trial & Invite Guest',
                  price: '$0',
                  period: 'forever for invited guests',
                  features: [
                    'Unlimited browser trial in /try (LaTeX, Typst, Markdown, Slides)',
                    'All 104 official journal & conference templates',
                    'Up to 3 active private projects & 500 MB storage',
                    'Bring Your Own OpenAI API Key (BYOK)',
                  ],
                  cta: 'Try in browser',
                  href: '/try',
                  highlight: false,
                },
                {
                  name: 'Standard Scholar',
                  price: '$12',
                  period: 'per month · or redeem Personal/Code Pass',
                  features: [
                    'Unlimited private & collaborative manuscripts',
                    'Full Research Library with PDF highlighting & OpenAlex search',
                    'Included daily & monthly Orca AI token allowance',
                    'Folder-level & file-level RBAC sharing',
                  ],
                  cta: 'Redeem invitation or pass',
                  href: '/redeem',
                  highlight: true,
                },
                {
                  name: 'Pro & Lab Organization',
                  price: '$29',
                  period: 'per researcher / month',
                  features: [
                    'Priority multi-file compilation & version snapshots',
                    '5x Orca AI token allowance + literature synthesis',
                    'Organization seat contracts & centralized billing',
                    'Sysop audit log & compliance exports',
                  ],
                  cta: 'Sign in to workspace',
                  href: '/login',
                  highlight: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl p-6 border flex flex-col justify-between ${
                    plan.highlight
                      ? 'border-[#1c1c1a] bg-[#fcfcf9] shadow-md'
                      : 'border-[#e2e2d8] bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#1c1c1a]">
                        {plan.name}
                      </h3>
                      {plan.highlight ? (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1c1c1a] text-white">
                          Most popular
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#1c1c1a]">
                        {plan.price}
                      </span>
                      <span className="text-xs text-[#575751]">{plan.period}</span>
                    </div>
                    <ul className="mt-6 space-y-2.5 text-sm text-[#575751]">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="text-[#0d9488] font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={plan.href}
                    className={`mt-8 w-full py-2.5 rounded-md text-center text-sm font-medium transition-colors ${
                      plan.highlight
                        ? 'bg-[#1c1c1a] text-white hover:bg-[#33332f]'
                        : 'bg-[#f4f4ee] text-[#1c1c1a] hover:bg-[#e2e2d8]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2e2d8] bg-[#f4f4ee] py-12 text-sm text-[#575751]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <CortexLogo size="sm" subtitle="by Corca" />
            <p className="mt-2 text-xs text-[#8a8a80]">
              © {new Date().getFullYear()} Corca Inc. Built for scholars, designed for research.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <Link href="/gallery" className="hover:text-[#1c1c1a]">
              Open workspace
            </Link>
            <Link href="/docs/en" className="hover:text-[#1c1c1a]">
              Documentation
            </Link>
            <Link
              href="/docs/en/guides/latex-for-beginners"
              className="hover:text-[#1c1c1a]"
            >
              LaTeX for Beginners
            </Link>
            <Link href="/legal/en/terms" className="hover:text-[#1c1c1a]">
              Terms of Service
            </Link>
            <Link href="/legal/en/privacy" className="hover:text-[#1c1c1a]">
              Privacy Policy
            </Link>
            <a href="mailto:support@corca.ai" className="hover:text-[#1c1c1a]">
              support@corca.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
