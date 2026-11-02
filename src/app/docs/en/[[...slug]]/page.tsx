'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';
import {
  DOCS_ARTICLES,
  LATEX_BEGINNER_STEPS,
  findDocBySlug,
} from '@/lib/data/docs-catalog';

export default function DocsPortalPage() {
  const params = useParams<{ slug?: string[] }>();
  const slugArray = Array.isArray(params?.slug) ? params.slug : [];
  const slugPath = slugArray.join('/');

  const currentDoc = useMemo(() => findDocBySlug(slugPath), [slugPath]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [customTex, setCustomTex] = useState(LATEX_BEGINNER_STEPS[0].sampleCode);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DOCS_ARTICLES;
    return DOCS_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const isLatexGuide = slugPath === 'guides/latex-for-beginners';

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2e2d8] bg-[#fcfcf9]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <CortexLogo subtitle="Documentation" href="/docs/en" />
            <nav className="hidden md:flex items-center gap-5 text-sm text-[#575751]">
              <Link href="/" className="hover:text-[#1c1c1a]">
                Home
              </Link>
              <Link href="/gallery" className="hover:text-[#1c1c1a]">
                Open workspace
              </Link>
              <Link href="/try" className="hover:text-[#1c1c1a]">
                Try in browser
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="px-3 py-1.5 rounded-md border border-[#d6d6cc] bg-white text-xs text-[#575751] flex items-center gap-3 hover:border-[#1c1c1a]"
            >
              <span>Search documentation...</span>
              <kbd className="font-mono-code text-[11px] bg-[#f4f4ee] px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </button>
            <Link
              href="/app"
              className="px-3.5 py-1.5 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Left Sidebar */}
        <aside className="space-y-6 border-b md:border-b-0 md:border-r border-[#e2e2d8] pb-6 md:pb-0 md:pr-6">
          {['Getting Started', 'Guides', 'Features'].map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-2.5">
                {cat}
              </h3>
              <ul className="space-y-1">
                {DOCS_ARTICLES.filter((a) => a.category === cat).map((art) => {
                  const href = art.slug ? `/docs/en/${art.slug}` : '/docs/en';
                  const active = art.slug === slugPath;
                  return (
                    <li key={art.slug || 'root'}>
                      <Link
                        href={href}
                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          active
                            ? 'bg-[#1c1c1a] text-white font-medium'
                            : 'text-[#575751] hover:bg-[#f4f4ee] hover:text-[#1c1c1a]'
                        }`}
                      >
                        {art.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Article Content */}
        <main className="min-w-0">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0d9488]">
              {currentDoc.category}
            </p>
            <h1 className="font-serif-academic text-3xl sm:text-4xl font-semibold text-[#1c1c1a] mt-1">
              {currentDoc.title}
            </h1>
            <p className="text-base text-[#575751] mt-2">{currentDoc.summary}</p>
          </div>

          <div className="space-y-8">
            {currentDoc.sections.map((sec) => (
              <section
                key={sec.heading}
                className="p-6 rounded-xl border border-[#e2e2d8] bg-white"
              >
                <h2 className="text-lg font-semibold text-[#1c1c1a]">{sec.heading}</h2>
                <p className="text-sm text-[#575751] mt-2 leading-relaxed">{sec.body}</p>
                {sec.code ? (
                  <pre className="mt-4 p-4 rounded-lg bg-[#fafaf6] border border-[#e2e2d8] font-mono-code text-xs text-[#1c1c1a] overflow-x-auto">
                    {sec.code}
                  </pre>
                ) : null}
              </section>
            ))}
          </div>

          {/* Interactive 5-Step LaTeX Guide */}
          {isLatexGuide ? (
            <div className="mt-10 rounded-xl border border-[#1c1c1a] bg-white overflow-hidden shadow-md">
              <div className="bg-[#1c1c1a] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#14b8a6] font-semibold">
                    Interactive Tutorial
                  </span>
                  <h3 className="text-base font-semibold">
                    5-Step Hands-On LaTeX Sandbox
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {LATEX_BEGINNER_STEPS.map((st, idx) => (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => {
                        setActiveStep(idx);
                        setCustomTex(st.sampleCode);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        activeStep === idx
                          ? 'bg-[#14b8a6] text-[#121211]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Step {st.step}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-[#f4f4ee] border-b border-[#e2e2d8]">
                <h4 className="font-semibold text-sm text-[#1c1c1a]">
                  Step {LATEX_BEGINNER_STEPS[activeStep].step}:{' '}
                  {LATEX_BEGINNER_STEPS[activeStep].title}
                </h4>
                <p className="text-xs text-[#575751] mt-1">
                  {LATEX_BEGINNER_STEPS[activeStep].explanation}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e2e2d8]">
                <div className="p-4">
                  <label
                    htmlFor="guide-tex-editor"
                    className="block text-xs font-mono-code text-[#8a8a80] mb-2"
                  >
                    Editable LaTeX Snippet
                  </label>
                  <textarea
                    id="guide-tex-editor"
                    rows={11}
                    value={customTex}
                    onChange={(e) => setCustomTex(e.target.value)}
                    className="w-full font-mono-code text-xs p-3 rounded border border-[#e2e2d8] bg-[#fafaf6] focus:outline-none focus:border-[#1c1c1a]"
                  />
                </div>
                <div className="p-5 bg-[#fafaf6] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono-code text-[#8a8a80] mb-2">
                      Live Typeset Explanation
                    </div>
                    <div className="p-4 rounded border border-[#e2e2d8] bg-white font-serif-academic text-sm leading-relaxed">
                      <pre className="whitespace-pre-wrap font-serif-academic text-sm text-[#1c1c1a]">
                        {customTex
                          .replace(/\\textbf\{([^}]*)\}/g, '$1 (bold)')
                          .replace(/\\emph\{([^}]*)\}/g, '$1 (italic)')}
                      </pre>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href="/try/tex?tour=1"
                      className="px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
                    >
                      Continue in Full Browser Workspace →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Search Modal */}
      {searchOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-lg w-full overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-[#e2e2d8] flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Search guides, shortcuts, templates, BibTeX..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm px-2 py-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2.5 py-1 rounded bg-[#f4f4ee] text-[#575751]"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[#e2e2d8]">
              {filteredDocs.map((doc) => (
                <Link
                  key={doc.slug || 'home'}
                  href={doc.slug ? `/docs/en/${doc.slug}` : '/docs/en'}
                  onClick={() => setSearchOpen(false)}
                  className="block p-3.5 hover:bg-[#fafaf6]"
                >
                  <div className="text-xs font-medium text-[#0d9488]">{doc.category}</div>
                  <div className="text-sm font-semibold text-[#1c1c1a]">{doc.title}</div>
                  <div className="text-xs text-[#575751] mt-0.5">{doc.summary}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
