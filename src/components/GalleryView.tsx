'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CortexLogo } from '@/components/CortexLogo';
import { DEFAULT_GALLERY_WORKS, type GalleryWorkItem } from '@/lib/data/phrasebank';

const CATEGORIES = ['All work', 'Papers', 'Notes', 'Slides', 'Templates'] as const;
const TOPICS = [
  'All topics',
  'computer science',
  'machine learning',
  'mathematics',
  'physics',
] as const;

export function GalleryView({ initialTopic }: { initialTopic?: string }) {
  const [works, setWorks] = useState<GalleryWorkItem[]>(DEFAULT_GALLERY_WORKS);
  const [category, setCategory] = useState<string>('All work');
  const [topic, setTopic] = useState<string>(initialTopic || 'All topics');
  const [sort, setSort] = useState<'recent' | 'title'>('recent');
  const [selectedWork, setSelectedWork] = useState<GalleryWorkItem | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      category,
      topic,
      sort,
    });
    fetch(`/api/gallery?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.works)) setWorks(d.works);
      })
      .catch(() => {});
  }, [category, topic, sort]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a]">
      <header className="border-b border-[#e2e2d8] bg-[#fcfcf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <CortexLogo subtitle="Open Workspace" />
            <nav className="hidden sm:flex items-center gap-5 text-sm text-[#575751]">
              <Link href="/gallery" className="text-[#1c1c1a] font-medium">
                Gallery
              </Link>
              <Link href="/docs/en" className="hover:text-[#1c1c1a]">
                Documentation
              </Link>
              <Link href="/try" className="hover:text-[#1c1c1a]">
                Try in browser
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm font-medium text-[#575751] hover:text-[#1c1c1a]"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="px-4 py-1.5 text-sm font-medium bg-[#1c1c1a] text-white rounded-md hover:bg-[#33332f]"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0d9488]">
            The Open Workspace
          </p>
          <h1 className="font-serif-academic text-4xl font-semibold text-[#1c1c1a] mt-1">
            Explore research manuscripts, notes, slides, and templates
          </h1>
          <p className="text-sm sm:text-base text-[#575751] mt-3">
            Inspect source code and compiled previews shared by the CorTeX scholarly
            community, or open any work directly in the browser editor.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#e2e2d8]">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-[#1c1c1a] text-white'
                    : 'bg-[#f4f4ee] text-[#575751] hover:text-[#1c1c1a]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              aria-label="Filter by topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-xs bg-white border border-[#e2e2d8] rounded-md px-3 py-1.5 text-[#1c1c1a]"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort works"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'recent' | 'title')}
              className="text-xs bg-white border border-[#e2e2d8] rounded-md px-3 py-1.5 text-[#1c1c1a]"
            >
              <option value="recent">Most recent</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Works Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {works.map((w) => {
            const tryRoute =
              w.format === 'typst'
                ? '/try/typ'
                : w.format === 'markdown'
                  ? '/try/md'
                  : w.format === 'slides'
                    ? '/try/slides'
                    : '/try/tex';

            return (
              <article
                key={w.id}
                className="rounded-xl border border-[#e2e2d8] bg-white p-6 flex flex-col justify-between shadow-sm hover:border-[#1c1c1a] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#8a8a80]">
                    <span className="px-2.5 py-0.5 rounded bg-[#f4f4ee] text-[#1c1c1a] font-medium">
                      {w.category} · {w.format.toUpperCase()}
                    </span>
                    <span>Updated {w.updatedLabel}</span>
                  </div>
                  <h2 className="font-serif-academic text-xl font-semibold text-[#1c1c1a] mt-3">
                    {w.title}
                  </h2>
                  <p className="text-xs text-[#575751] mt-1 font-medium">
                    By {w.authorName}
                  </p>
                  <p className="text-sm text-[#575751] mt-3 leading-relaxed">
                    {w.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {w.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/gallery/tags/${encodeURIComponent(tag)}`}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#f4f4ee] text-[#575751] hover:text-[#1c1c1a]"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e2e2d8] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedWork(w)}
                    className="text-xs font-medium text-[#1c1c1a] hover:underline"
                  >
                    Inspect source ({w.mainFileName})
                  </button>
                  <Link
                    href={tryRoute}
                    className="px-3.5 py-1.5 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
                  >
                    Open in Try Mode →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Source Inspection Modal */}
      {selectedWork ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-[#e2e2d8] flex items-center justify-between bg-[#f4f4ee]">
              <div>
                <h3 className="font-semibold text-base text-[#1c1c1a]">
                  {selectedWork.title}
                </h3>
                <p className="text-xs text-[#575751]">
                  {selectedWork.authorName} · {selectedWork.mainFileName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWork(null)}
                className="px-3 py-1 rounded text-xs font-medium bg-white border border-[#d6d6cc] hover:bg-[#eaeae2]"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-[#fafaf6]">
              <pre className="font-mono-code text-xs leading-relaxed text-[#1c1c1a] whitespace-pre-wrap">
                {selectedWork.content}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
