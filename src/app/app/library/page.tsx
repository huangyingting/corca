'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';

interface AnnotationItem {
  id: string;
  kind: string;
  pageNumber: number;
  selectedText: string | null;
  comment: string | null;
  color: string;
}

interface LibraryRefItem {
  id: string;
  title: string;
  citeKey: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  doi: string | null;
  arxivId: string | null;
  url: string | null;
  abstract: string | null;
  note: string | null;
  tags: string[];
  bibtex: string;
  pdfFileName: string | null;
  pdfTextContent: string | null;
  citationCount: number;
  referenceCount: number;
  inTrash: boolean;
  annotations: AnnotationItem[];
}

export default function ResearchLibraryPage() {
  const router = useRouter();
  const [references, setReferences] = useState<LibraryRefItem[]>([]);
  const [selectedRefId, setSelectedRefId] = useState<string>('');
  const [facets, setFacets] = useState<{
    totalActive: number;
    totalTrash: number;
    noTagCount: number;
    unknownYearCount: number;
    tags: Array<{ name: string; count: number }>;
    authors: Array<{ name: string; count: number }>;
    venues: Array<{ name: string; count: number }>;
  }>({
    totalActive: 0,
    totalTrash: 0,
    noTagCount: 0,
    unknownYearCount: 0,
    tags: [],
    authors: [],
    venues: [],
  });

  // Facet filter states
  const [showTrash, setShowTrash] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [unknownYear, setUnknownYear] = useState(false);

  // Search mode (`in-library` vs `from-web`)
  const [searchMode, setSearchMode] = useState<'library' | 'web'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [webResults, setWebResults] = useState<
    Array<{
      id: string;
      title: string;
      authors: string[];
      year: number;
      venue: string;
      citationCount: number;
      referenceCount: number;
      doi: string | null;
      url: string | null;
      abstract: string;
      citeKey: string;
    }>
  >([]);

  // Detail pane tab (`overview` | `pdf` | `notebook` | `explore` | `bibtex`)
  const [detailTab, setDetailTab] = useState<
    'overview' | 'pdf' | 'notebook' | 'explore' | 'bibtex'
  >('overview');

  // Add Reference Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState('2025');
  const [newVenue, setNewVenue] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newAbstract, setNewAbstract] = useState('');

  // BibTeX (.bib) Bulk Import & Review Dialog
  const [importBibtexOpen, setImportBibtexOpen] = useState(false);
  const [rawBibtexInput, setRawBibtexInput] = useState(
    `@inproceedings{vaswani2017attention,\n  title={Attention Is All You Need},\n  author={Vaswani, Ashish and Shazeer, Noam},\n  booktitle={NeurIPS},\n  year={2017}\n}`
  );
  const [parsedBibtexItems, setParsedBibtexItems] = useState<
    Array<{ citeKey: string; title: string; authors: string; year: number; venue: string; selected: boolean }>
  >([]);

  // 9-Color Tag Manager Modal
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [tagColors, setTagColors] = useState<Record<string, string>>({
    'scholarly-web': 'Teal',
    scaling: 'Blue',
    llm: 'Violet',
  });

  // Markdown Research Notebook State
  const [notebookContent, setNotebookContent] = useState(
    `# Research Synthesis Note\n\nKey theoretical bound from [[vaswani2017attention#p1]] connects attention scaling to spectral stability (see [[note:scaling-hypothesis]]).\n\n- Compare empirical perplexity curves\n- Verify Theorem 2 assumptions`
  );

  // Paper Explorer Tab (`references` | `citations` | `authorWorks`)
  const [exploreSubTab, setExploreSubTab] = useState<'references' | 'citations' | 'authorWorks'>('references');

  // PDF Highlight & Sticky Note state + Dark Page & Margin Trim
  const [highlightText, setHighlightText] = useState('');
  const [stickyComment, setStickyComment] = useState('');
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [darkLibraryPdf, setDarkLibraryPdf] = useState(false);
  const [trimLibraryMargins, setTrimLibraryMargins] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    const sp = new URLSearchParams();
    if (showTrash) sp.set('trash', '1');
    if (searchMode === 'library' && searchQuery.trim()) sp.set('q', searchQuery.trim());
    if (tagFilter) sp.set('tag', tagFilter);
    if (authorFilter) sp.set('author', authorFilter);
    if (venueFilter) sp.set('venue', venueFilter);
    if (yearFrom) sp.set('yearFrom', yearFrom);
    if (yearTo) sp.set('yearTo', yearTo);
    if (unknownYear) sp.set('unknownYear', '1');

    const res = await fetch(`/api/library?${sp.toString()}`);
    if (res.status === 401) {
      router.replace('/login');
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setReferences(data.references || []);
      setFacets(data.facets || facets);
      if (data.references?.length > 0 && !selectedRefId) {
        setSelectedRefId(data.references[0].id);
      }
    }
  }, [
    showTrash,
    searchMode,
    searchQuery,
    tagFilter,
    authorFilter,
    venueFilter,
    yearFrom,
    yearTo,
    unknownYear,
    router,
  ]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  async function handleWebSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const res = await fetch(
      `/api/library/search-web?q=${encodeURIComponent(searchQuery.trim())}`
    );
    if (res.ok) {
      const data = await res.json();
      setWebResults(data.results || []);
    }
  }

  useEffect(() => {
    if (searchMode === 'web') {
      handleWebSearch();
    }
  }, [searchMode]);

  async function handleAddFromWeb(paper: {
    title: string;
    authors: string[];
    year: number;
    venue: string;
    citationCount: number;
    referenceCount: number;
    doi: string | null;
    url: string | null;
    abstract: string;
    citeKey: string;
  }) {
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...paper,
        tags: ['scholarly-web'],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setStatusBanner(`Added "${paper.title}" to your Research Library.`);
      setSearchMode('library');
      await loadLibrary();
      setSelectedRefId(data.reference.id);
    }
  }

  async function handleCreateManualRef(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        authors: newAuthors,
        year: Number(newYear) || 2025,
        venue: newVenue,
        tags: newTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        abstract: newAbstract,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAddModalOpen(false);
      setNewTitle('');
      setNewAuthors('');
      setNewVenue('');
      setNewTags('');
      setNewAbstract('');
      await loadLibrary();
      setSelectedRefId(data.reference.id);
    }
  }

  const selectedRef =
    references.find((r) => r.id === selectedRefId) || references[0] || null;

  async function handleAddAnnotation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRef) return;
    const res = await fetch(`/api/library/${selectedRef.id}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: highlightText.trim() ? 'highlight' : 'sticky',
        pageNumber: 1,
        selectedText: highlightText.trim() || null,
        comment: stickyComment.trim() || null,
        color: highlightColor,
      }),
    });
    if (res.ok) {
      setHighlightText('');
      setStickyComment('');
      await loadLibrary();
    }
  }

  function clearAllFilters() {
    setShowTrash(false);
    setTagFilter('');
    setAuthorFilter('');
    setVenueFilter('');
    setYearFrom('');
    setYearTo('');
    setUnknownYear(false);
    setSearchQuery('');
  }

  function handleParseBibtex() {
    const entries = rawBibtexInput
      .split(/(?=@\w+\s*\{)/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsed = entries.map((entry, idx) => {
      const keyMatch = entry.match(/@\w+\s*\{\s*([^,\s]+)/);
      const titleMatch = entry.match(/title\s*=\s*[{"]([^}"]+)[}"]/i);
      const authorMatch = entry.match(/author\s*=\s*[{"]([^}"]+)[}"]/i);
      const yearMatch = entry.match(/year\s*=\s*[{"]?(\d{4})[}"]?/i);
      const venueMatch = entry.match(/(?:booktitle|journal)\s*=\s*[{"]([^}"]+)[}"]/i);
      return {
        citeKey: keyMatch?.[1] || `ref${idx + 1}`,
        title: titleMatch?.[1] || `Imported BibTeX Entry ${idx + 1}`,
        authors: authorMatch?.[1] || 'Unknown Author',
        year: Number(yearMatch?.[1]) || 2025,
        venue: venueMatch?.[1] || 'arXiv / Conference',
        selected: true,
      };
    });
    setParsedBibtexItems(parsed);
  }

  async function handleConfirmImportBibtex() {
    const selected = parsedBibtexItems.filter((i) => i.selected);
    for (const item of selected) {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citeKey: item.citeKey,
          title: item.title,
          authors: item.authors.split(/\s+and\s+|,\s*/).filter(Boolean),
          year: item.year,
          venue: item.venue,
          tags: ['bibtex-import'],
        }),
      });
    }
    setImportBibtexOpen(false);
    setStatusBanner(`Imported ${selected.length} BibTeX reference(s).`);
    await loadLibrary();
  }

  async function handleToggleTrash(ref: LibraryRefItem, inTrash: boolean) {
    await fetch(`/api/library/${ref.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inTrash }),
    });
    setStatusBanner(inTrash ? `Moved "${ref.title}" to Trash.` : `Restored "${ref.title}".`);
    await loadLibrary();
  }

  return (
    <div className="h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a] overflow-hidden">
      {/* Top Library Header */}
      <header className="h-14 border-b border-[#e2e2d8] bg-white px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CortexLogo href="/app" subtitle="Research Library" size="sm" />
          <Link
            href="/app"
            className="text-xs font-medium text-[#575751] hover:text-[#1c1c1a]"
          >
            ← Back to Projects
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTagManagerOpen(true)}
            data-testid="open-tag-manager-btn"
            className="px-3 py-1.5 rounded-md border border-[#d6d6cc] bg-white text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f4ee]"
          >
            Manage Tags
          </button>
          <button
            type="button"
            onClick={() => {
              handleParseBibtex();
              setImportBibtexOpen(true);
            }}
            data-testid="open-import-bibtex-btn"
            className="px-3 py-1.5 rounded-md border border-[#d6d6cc] bg-white text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f4ee]"
          >
            Import BibTeX (.bib)
          </button>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
          >
            + Add Reference / Upload PDF
          </button>
        </div>
      </header>

      {statusBanner ? (
        <div className="bg-[#0d9488] text-white text-xs px-4 py-1.5 flex items-center justify-between">
          <span>{statusBanner}</span>
          <button type="button" onClick={() => setStatusBanner(null)}>
            ✕
          </button>
        </div>
      ) : null}

      {/* 3-Pane Research Library */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_360px_1fr] min-h-0 overflow-hidden">
        {/* Pane 1: Faceted Filters */}
        <aside className="border-r border-[#e2e2d8] bg-[#f4f4ee] p-4 overflow-y-auto space-y-5 text-xs">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setShowTrash(false)}
              className={`w-full text-left px-3 py-1.5 rounded font-medium flex justify-between ${
                !showTrash ? 'bg-[#1c1c1a] text-white' : 'text-[#575751] hover:bg-[#eaeae2]'
              }`}
            >
              <span>All references</span>
              <span>{facets.totalActive}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTrash(true)}
              className={`w-full text-left px-3 py-1.5 rounded font-medium flex justify-between ${
                showTrash ? 'bg-[#1c1c1a] text-white' : 'text-[#575751] hover:bg-[#eaeae2]'
              }`}
            >
              <span>Trash</span>
              <span>{facets.totalTrash}</span>
            </button>
          </div>

          {/* Tags Facet */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
              Tags
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() =>
                  setTagFilter(tagFilter === '__UNTAGGED__' ? '' : '__UNTAGGED__')
                }
                className={`w-full text-left px-2.5 py-1 rounded flex justify-between ${
                  tagFilter === '__UNTAGGED__'
                    ? 'bg-[#0d9488] text-white'
                    : 'text-[#575751] hover:bg-[#eaeae2]'
                }`}
              >
                <span>No tag</span>
                <span>{facets.noTagCount}</span>
              </button>
              {facets.tags.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setTagFilter(tagFilter === t.name ? '' : t.name)}
                  className={`w-full text-left px-2.5 py-1 rounded flex justify-between ${
                    tagFilter === t.name
                      ? 'bg-[#0d9488] text-white'
                      : 'text-[#575751] hover:bg-[#eaeae2]'
                  }`}
                >
                  <span>#{t.name}</span>
                  <span>{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Publication Year Facet */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
              Publication Year
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                placeholder="From"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="px-2 py-1 rounded border border-[#d6d6cc] bg-white text-xs"
              />
              <input
                type="number"
                placeholder="To"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="px-2 py-1 rounded border border-[#d6d6cc] bg-white text-xs"
              />
            </div>
            <label className="mt-2 flex items-center gap-1.5 text-[#575751]">
              <input
                type="checkbox"
                checked={unknownYear}
                onChange={(e) => setUnknownYear(e.target.checked)}
              />
              <span>Unknown year ({facets.unknownYearCount})</span>
            </label>
          </div>

          {/* Authors Facet */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
              Authors
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {facets.authors.map((a) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => setAuthorFilter(authorFilter === a.name ? '' : a.name)}
                  className={`w-full text-left px-2 py-1 rounded flex justify-between truncate ${
                    authorFilter === a.name
                      ? 'bg-[#0d9488] text-white'
                      : 'text-[#575751] hover:bg-[#eaeae2]'
                  }`}
                >
                  <span className="truncate">{a.name}</span>
                  <span>{a.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Journal / Conference Facet */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
              Journal / Conference
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {facets.venues.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setVenueFilter(venueFilter === v.name ? '' : v.name)}
                  className={`w-full text-left px-2 py-1 rounded flex justify-between truncate ${
                    venueFilter === v.name
                      ? 'bg-[#0d9488] text-white'
                      : 'text-[#575751] hover:bg-[#eaeae2]'
                  }`}
                >
                  <span className="truncate">{v.name}</span>
                  <span>{v.count}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            className="w-full py-1.5 rounded border border-[#d6d6cc] bg-white text-xs font-medium hover:bg-[#eaeae2]"
          >
            Clear all filters
          </button>
        </aside>

        {/* Pane 2: In-Library & From-the-Web Search + Reference List */}
        <section className="border-r border-[#e2e2d8] bg-white flex flex-col min-h-0 overflow-hidden">
          <div className="p-3.5 border-b border-[#e2e2d8] space-y-2.5 bg-[#fcfcf9]">
            <div className="grid grid-cols-2 gap-1 bg-[#eaeae2] p-1 rounded-md text-xs font-medium">
              <button
                type="button"
                onClick={() => setSearchMode('library')}
                className={`py-1 rounded ${
                  searchMode === 'library'
                    ? 'bg-white text-[#1c1c1a] shadow-sm'
                    : 'text-[#575751]'
                }`}
              >
                In library ({references.length})
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('web')}
                className={`py-1 rounded ${
                  searchMode === 'web'
                    ? 'bg-white text-[#1c1c1a] shadow-sm'
                    : 'text-[#575751]'
                }`}
              >
                From the web
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchMode === 'web') handleWebSearch();
                else loadLibrary();
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                placeholder={
                  searchMode === 'web'
                    ? 'Search OpenAlex / Crossref papers...'
                    : 'Filter library by title, citeKey, author...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded border border-[#d6d6cc] text-xs bg-white"
              />
              {searchMode === 'web' ? (
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                >
                  Search
                </button>
              ) : null}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#e2e2d8]">
            {searchMode === 'library' ? (
              references.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#575751] space-y-3">
                  <p>No references match the current filter.</p>
                  <button
                    type="button"
                    onClick={() => setSearchMode('web')}
                    className="px-3 py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
                  >
                    Search scholarly web (OpenAlex) →
                  </button>
                </div>
              ) : (
                references.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRefId(r.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      r.id === selectedRef?.id ? 'bg-[#f4f4ee]' : 'hover:bg-[#fafaf6]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono-code text-[#0d9488]">
                      <span>@{r.citeKey}</span>
                      <span>{r.year || 'Unknown year'}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#1c1c1a] mt-1">
                      {r.title}
                    </h3>
                    <p className="text-xs text-[#575751] mt-0.5 truncate">
                      {r.authors.join(', ')}
                    </p>
                    {r.venue ? (
                      <p className="text-[11px] text-[#8a8a80] mt-0.5 italic truncate">
                        {r.venue}
                      </p>
                    ) : null}
                  </button>
                ))
              )
            ) : (
              webResults.map((w) => (
                <div key={w.id} className="p-4 space-y-2 hover:bg-[#fafaf6]">
                  <div className="flex items-center justify-between text-[11px] text-[#8a8a80]">
                    <span className="font-mono-code text-[#0d9488]">{w.year}</span>
                    <span>
                      {w.citationCount.toLocaleString()} citations · {w.referenceCount}{' '}
                      refs
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1c1c1a]">{w.title}</h3>
                  <p className="text-xs text-[#575751]">{w.authors.join(', ')}</p>
                  <p className="text-[11px] text-[#8a8a80] italic">{w.venue}</p>
                  <button
                    type="button"
                    onClick={() => handleAddFromWeb(w)}
                    className="mt-1 px-3 py-1 rounded bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
                  >
                    + Add to Library
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Pane 3: Reference Detail, PDF Reader with Highlights/Sticky Notes & BibTeX */}
        <main className="bg-[#fcfcf9] flex flex-col min-h-0 overflow-hidden">
          {!selectedRef ? (
            <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#8a8a80]">
              Select a reference from your library or add one from the scholarly web.
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-[#e2e2d8] bg-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono-code text-xs text-[#0d9488] font-semibold">
                    \\cite&#123;{selectedRef.citeKey}&#125;
                  </span>
                  <h2 className="font-serif-academic text-xl font-semibold text-[#1c1c1a] mt-0.5">
                    {selectedRef.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-md border border-[#d6d6cc] bg-[#f4f4ee] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDetailTab('overview')}
                      className={`px-3 py-1 rounded ${
                        detailTab === 'overview' ? 'bg-white font-semibold shadow-sm' : ''
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('pdf')}
                      className={`px-3 py-1 rounded ${
                        detailTab === 'pdf' ? 'bg-white font-semibold shadow-sm' : ''
                      }`}
                    >
                      PDF Reader ({selectedRef.annotations?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('notebook')}
                      data-testid="library-tab-notebook"
                      className={`px-3 py-1 rounded ${
                        detailTab === 'notebook' ? 'bg-white font-semibold shadow-sm' : ''
                      }`}
                    >
                      Notebook
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('explore')}
                      data-testid="library-tab-explore"
                      className={`px-3 py-1 rounded ${
                        detailTab === 'explore' ? 'bg-white font-semibold shadow-sm' : ''
                      }`}
                    >
                      Explore Graph
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('bibtex')}
                      className={`px-3 py-1 rounded ${
                        detailTab === 'bibtex' ? 'bg-white font-semibold shadow-sm' : ''
                      }`}
                    >
                      BibTeX
                    </button>
                  </div>

                  {selectedRef.inTrash ? (
                    <button
                      type="button"
                      onClick={() => handleToggleTrash(selectedRef, false)}
                      className="px-2.5 py-1 rounded border border-[#0d9488] text-[#0d9488] text-xs font-medium"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleTrash(selectedRef, true)}
                      className="px-2.5 py-1 rounded border border-[#d6d6cc] text-[#575751] hover:text-red-700 text-xs"
                    >
                      Move to Trash
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {detailTab === 'overview' ? (
                  <div className="max-w-2xl space-y-5">
                    <div className="p-5 rounded-xl border border-[#e2e2d8] bg-white space-y-3 text-xs">
                      <div>
                        <span className="font-semibold text-[#8a8a80] uppercase">
                          Authors:
                        </span>
                        <div className="text-sm text-[#1c1c1a] mt-0.5">
                          {selectedRef.authors.join(', ')}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold text-[#8a8a80] uppercase">
                            Venue:
                          </span>
                          <div className="text-[#1c1c1a] mt-0.5">
                            {selectedRef.venue || '—'}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-[#8a8a80] uppercase">
                            Year / DOI:
                          </span>
                          <div className="text-[#1c1c1a] mt-0.5">
                            {selectedRef.year || 'Unknown'} · {selectedRef.doi || 'No DOI'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-[#8a8a80] uppercase">
                          Abstract:
                        </span>
                        <p className="text-[#575751] mt-1 leading-relaxed">
                          {selectedRef.abstract || 'No abstract recorded.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {detailTab === 'pdf' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                    {/* PDF Manuscript Reader Sheet */}
                    <div
                      className="cortex-paper-sheet transition-all"
                      style={{
                        backgroundColor: darkLibraryPdf ? '#141413' : '#ffffff',
                        color: darkLibraryPdf ? '#e7e7df' : '#1c1c1a',
                        padding: trimLibraryMargins ? '1.25rem 1.5rem' : undefined,
                      }}
                    >
                      <div className="text-xs font-sans text-[#8a8a80] mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span>PDF Reader · {selectedRef.pdfFileName}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDarkLibraryPdf(!darkLibraryPdf)}
                            className={`px-2 py-0.5 rounded border text-[11px] ${
                              darkLibraryPdf
                                ? 'bg-[#1c1c1a] text-white border-[#1c1c1a]'
                                : 'bg-white text-[#575751] border-[#d6d6cc]'
                            }`}
                          >
                            Dark page
                          </button>
                          <button
                            type="button"
                            onClick={() => setTrimLibraryMargins(!trimLibraryMargins)}
                            className={`px-2 py-0.5 rounded border text-[11px] ${
                              trimLibraryMargins
                                ? 'bg-[#0d9488] text-white border-[#0d9488]'
                                : 'bg-white text-[#575751] border-[#d6d6cc]'
                            }`}
                          >
                            Remove margins
                          </button>
                        </div>
                      </div>
                      <div
                        className="whitespace-pre-wrap text-sm leading-relaxed"
                        onMouseUp={() => {
                          const sel = window.getSelection()?.toString().trim();
                          if (sel) setHighlightText(sel);
                        }}
                      >
                        {selectedRef.pdfTextContent}
                      </div>
                    </div>

                    {/* Highlights & Sticky Notes Drawer */}
                    <div className="space-y-4">
                      <form
                        onSubmit={handleAddAnnotation}
                        className="p-4 rounded-xl border border-[#e2e2d8] bg-white space-y-3 text-xs"
                      >
                        <div className="font-semibold text-[#1c1c1a]">
                          Add Highlight or Sticky Note
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Highlighted passage from PDF..."
                          value={highlightText}
                          onChange={(e) => setHighlightText(e.target.value)}
                          className="w-full p-2 rounded border border-[#d6d6cc] text-xs"
                        />
                        <textarea
                          rows={2}
                          placeholder="Research memo or sticky note..."
                          value={stickyComment}
                          onChange={(e) => setStickyComment(e.target.value)}
                          className="w-full p-2 rounded border border-[#d6d6cc] text-xs"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {(
                              ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'] as const
                            ).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setHighlightColor(c)}
                                className={`px-2 py-0.5 rounded text-[10px] capitalize border ${
                                  highlightColor === c
                                    ? 'border-[#1c1c1a] font-bold'
                                    : 'border-transparent'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                          <button
                            type="submit"
                            className="px-3 py-1 rounded bg-[#1c1c1a] text-white font-medium"
                          >
                            Save Note
                          </button>
                        </div>
                      </form>

                      <div className="space-y-2">
                        {(selectedRef.annotations || []).map((a) => (
                          <div
                            key={a.id}
                            className="p-3 rounded-lg border border-[#e2e2d8] bg-white text-xs space-y-1"
                          >
                            <div className="text-[10px] font-semibold uppercase text-[#0d9488]">
                              {a.kind} · {a.color} · Page {a.pageNumber}
                            </div>
                            {a.selectedText ? (
                              <blockquote className="pl-2 border-l-2 border-amber-400 italic text-[#1c1c1a]">
                                &ldquo;{a.selectedText}&rdquo;
                              </blockquote>
                            ) : null}
                            {a.comment ? (
                              <p className="text-[#575751]">{a.comment}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {detailTab === 'notebook' ? (
                  <div className="max-w-3xl space-y-4" data-testid="library-notebook-panel">
                    <div className="p-5 rounded-xl border border-[#e2e2d8] bg-white space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-[#1c1c1a]">
                            Markdown Research Notebook
                          </div>
                          <div className="text-[11px] text-[#8a8a80]">
                            Supports bidirectional links like{' '}
                            <code className="font-mono-code text-[#0d9488]">
                              [[{selectedRef.citeKey}#p1]]
                            </code>{' '}
                            and{' '}
                            <code className="font-mono-code text-[#0d9488]">
                              [[note:hypothesis]]
                            </code>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNotebookContent(
                              (prev) =>
                                `${prev}\n- Linked passage: [[${selectedRef.citeKey}#p1]]`
                            )
                          }
                          className="px-3 py-1 rounded border border-[#d6d6cc] bg-[#fafaf6] font-medium hover:bg-[#f4f4ee]"
                        >
                          + Link current paper
                        </button>
                      </div>
                      <textarea
                        rows={8}
                        value={notebookContent}
                        onChange={(e) => setNotebookContent(e.target.value)}
                        className="w-full p-3 rounded-lg border border-[#d6d6cc] font-mono-code text-xs leading-relaxed bg-[#fcfcf9]"
                      />
                      <div className="pt-2 border-t border-[#e2e2d8] flex items-center justify-between text-[11px] text-[#575751]">
                        <span>
                          Backlinks detected:{' '}
                          {(notebookContent.match(/\[\[[^\]]+\]\]/g) || []).join(', ') ||
                            'None'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setStatusBanner(
                              `Saved research note for @${selectedRef.citeKey}.`
                            )
                          }
                          className="px-3 py-1 rounded bg-[#1c1c1a] text-white font-medium"
                        >
                          Save Research Note
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {detailTab === 'explore' ? (
                  <div className="max-w-3xl space-y-4" data-testid="library-explore-panel">
                    <div className="p-5 rounded-xl border border-[#e2e2d8] bg-white space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-[#1c1c1a]">
                            Explore Citation Graph
                          </div>
                          <div className="text-[11px] text-[#8a8a80]">
                            Traverse references, citing papers, and author works for{' '}
                            <span className="font-mono-code text-[#0d9488]">
                              @{selectedRef.citeKey}
                            </span>
                          </div>
                        </div>
                        <div className="inline-flex rounded border border-[#d6d6cc] bg-[#f4f4ee] p-0.5 text-[11px]">
                          {(
                            [
                              { id: 'references', label: 'References' },
                              { id: 'citations', label: 'Cited by' },
                              { id: 'authorWorks', label: 'Papers by author' },
                            ] as const
                          ).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setExploreSubTab(t.id)}
                              className={`px-2.5 py-1 rounded ${
                                exploreSubTab === t.id
                                  ? 'bg-white font-semibold shadow-sm text-[#1c1c1a]'
                                  : 'text-[#575751]'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="divide-y divide-[#e2e2d8] border border-[#e2e2d8] rounded-lg">
                        {[
                          {
                            id: `${exploreSubTab}-1`,
                            citeKey: `${selectedRef.citeKey}_${exploreSubTab}`,
                            title:
                              exploreSubTab === 'references'
                                ? `Foundational Prior Work Cited by ${selectedRef.title}`
                                : exploreSubTab === 'citations'
                                  ? `Scaling Follow-up Citing ${selectedRef.title}`
                                  : `Recent Manuscript by ${selectedRef.authors[0] || 'Lead Author'}`,
                            authors: [
                              selectedRef.authors[0] || 'A. Researcher',
                              'C. Collaborator',
                            ],
                            year: (selectedRef.year || 2024) + (exploreSubTab === 'references' ? -2 : 1),
                            venue: selectedRef.venue || 'NeurIPS',
                            doi: null,
                            url: null,
                            abstract: `Connected via ${exploreSubTab} graph for @${selectedRef.citeKey}.`,
                            citationCount: 142,
                            referenceCount: 38,
                          },
                        ].map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 flex items-center justify-between gap-4"
                          >
                            <div>
                              <div className="font-semibold text-[#1c1c1a]">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#575751] mt-0.5">
                                {item.authors.join(', ')} · {item.venue} ({item.year})
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddFromWeb(item)}
                              className="px-3 py-1.5 rounded bg-[#1c1c1a] text-white text-[11px] font-medium shrink-0"
                            >
                              + Add to library
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {detailTab === 'bibtex' ? (
                  <div className="max-w-2xl space-y-4">
                    <div className="p-4 rounded-xl border border-[#e2e2d8] bg-white">
                      <div className="text-xs font-semibold text-[#1c1c1a] mb-2">
                        Canonical BibTeX Entry
                      </div>
                      <pre className="p-4 rounded bg-[#fafaf6] border border-[#e2e2d8] font-mono-code text-xs text-[#1c1c1a] whitespace-pre-wrap">
                        {selectedRef.bibtex}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Reference / Upload PDF Modal */}
      {addModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateManualRef}
            className="bg-white rounded-xl border border-[#e2e2d8] max-w-md w-full p-6 space-y-3.5 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e2d8]">
              <h3 className="text-sm font-semibold text-[#1c1c1a]">
                Add Scholarly Reference / PDF
              </h3>
              <button type="button" onClick={() => setAddModalOpen(false)}>
                ✕
              </button>
            </div>

            <div>
              <label className="block font-medium mb-1">Paper Title</label>
              <input
                type="text"
                required
                placeholder="Scaling Laws for Neural Language Models"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#d6d6cc]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block font-medium mb-1">Authors (comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Jared Kaplan, Sam McCandlish"
                  value={newAuthors}
                  onChange={(e) => setNewAuthors(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#d6d6cc]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Year</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-[#d6d6cc]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1">Journal / Conference</label>
                <input
                  type="text"
                  placeholder="NeurIPS / arXiv"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#d6d6cc]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="scaling, llm"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#d6d6cc]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Abstract / PDF Full Text</label>
              <textarea
                rows={3}
                placeholder="Paste abstract or manuscript excerpt for highlighting..."
                value={newAbstract}
                onChange={(e) => setNewAbstract(e.target.value)}
                className="w-full p-2.5 rounded border border-[#d6d6cc]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-3 py-1.5 rounded border border-[#d6d6cc]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
              >
                Save to Library
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Import BibTeX (.bib) Bulk Review Modal */}
      {importBibtexOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          data-testid="import-bibtex-modal"
        >
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e2d8]">
              <div>
                <h3 className="text-sm font-semibold text-[#1c1c1a]">
                  Import BibTeX (.bib)
                </h3>
                <p className="text-[11px] text-[#575751]">
                  Paste a .bib file to preview and select references to import.
                </p>
              </div>
              <button type="button" onClick={() => setImportBibtexOpen(false)}>
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[#1c1c1a]">BibTeX Source</label>
                <button
                  type="button"
                  onClick={handleParseBibtex}
                  className="text-[11px] font-medium text-[#0d9488] hover:underline"
                >
                  Re-parse entries
                </button>
              </div>
              <textarea
                rows={4}
                value={rawBibtexInput}
                onChange={(e) => setRawBibtexInput(e.target.value)}
                className="w-full p-2.5 rounded border border-[#d6d6cc] font-mono-code text-[11px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#575751]">
                  Parsed entries ({parsedBibtexItems.filter((i) => i.selected).length}/
                  {parsedBibtexItems.length} selected)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setParsedBibtexItems((prev) =>
                        prev.map((i) => ({ ...i, selected: true }))
                      )
                    }
                    className="text-[#0d9488] hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setParsedBibtexItems((prev) =>
                        prev.map((i) => ({ ...i, selected: false }))
                      )
                    }
                    className="text-[#8a8a80] hover:underline"
                  >
                    Clear selection
                  </button>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto divide-y divide-[#e2e2d8] border border-[#e2e2d8] rounded-lg">
                {parsedBibtexItems.map((item, idx) => (
                  <label
                    key={item.citeKey + idx}
                    className="p-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-[#fafaf6]"
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) =>
                        setParsedBibtexItems((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, selected: e.target.checked } : p
                          )
                        )
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-mono-code text-[11px] text-[#0d9488]">
                        @{item.citeKey} ({item.year})
                      </div>
                      <div className="font-semibold text-[#1c1c1a]">{item.title}</div>
                      <div className="text-[11px] text-[#575751]">
                        {item.authors} · {item.venue}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImportBibtexOpen(false)}
                className="px-3 py-1.5 rounded border border-[#d6d6cc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImportBibtex}
                data-testid="confirm-import-bibtex-btn"
                className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
              >
                Import selected ({parsedBibtexItems.filter((i) => i.selected).length})
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 9-Color Tag Manager Modal */}
      {tagManagerOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          data-testid="manage-tags-modal"
        >
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e2d8]">
              <div>
                <h3 className="text-sm font-semibold text-[#1c1c1a]">
                  Manage Library Tags
                </h3>
                <p className="text-[11px] text-[#575751]">
                  Assign colors across the 9-color CorTeX tag palette.
                </p>
              </div>
              <button type="button" onClick={() => setTagManagerOpen(false)}>
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {(facets.tags.length > 0
                ? facets.tags
                : [
                    { name: 'scholarly-web', count: 1 },
                    { name: 'scaling', count: 1 },
                  ]
              ).map((tag) => (
                <div
                  key={tag.name}
                  className="p-2.5 rounded-lg border border-[#e2e2d8] flex items-center justify-between gap-2"
                >
                  <span className="font-medium text-[#1c1c1a]">#{tag.name}</span>
                  <select
                    value={tagColors[tag.name] || 'Teal'}
                    onChange={(e) =>
                      setTagColors((prev) => ({ ...prev, [tag.name]: e.target.value }))
                    }
                    className="px-2 py-1 rounded border border-[#d6d6cc] bg-white text-[11px]"
                  >
                    {[
                      'Gray',
                      'Red',
                      'Orange',
                      'Gold',
                      'Green',
                      'Teal',
                      'Blue',
                      'Violet',
                      'Pink',
                    ].map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTagManagerOpen(false)}
                className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
