'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';
import {
  VENUE_TEMPLATE_CATEGORIES,
  VENUE_TEMPLATES,
  type VenueTemplateCategory,
} from '@/lib/data/venue-templates';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Researcher' | 'Viewer';
  planTier: string;
  hasOpenAiByok: boolean;
}

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  format: string;
  templateId: string;
  texliveVersion?: string;
  latexEngine?: string;
  mainFilePath?: string;
  isPinned?: boolean;
  isOwner?: boolean;
  visibility?: string;
  accessRole?: string;
  collaboratorCount?: number;
  memberCount?: number;
  fileCount?: number;
  fileNames?: string[];
  updatedAt: string;
}

export default function AppDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Project Filter & Search State
  const [projectFilter, setProjectFilter] = useState<'all' | 'mine' | 'shared' | 'pinned'>('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [renamingProject, setRenamingProject] = useState<{ id: string; name: string } | null>(null);

  // Modals
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [whatsNewModalOpen, setWhatsNewModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Feedback Modal State
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'latex' | 'feature' | 'general'>('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [includeEnvDetails, setIncludeEnvDetails] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // New Project Modal State
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All categories' | VenueTemplateCategory>('All categories');
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank-article');
  const [texliveVersion, setTexliveVersion] = useState('tl2026-20260826-b6584b4');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Import Project & Review Dialog State
  const [importSourceType, setImportSourceType] = useState<'github' | 'zip'>('github');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [importName, setImportName] = useState('');
  const [importReviewStep, setImportReviewStep] = useState(false);
  const [importMainTex, setImportMainTex] = useState('main.tex');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (!meData.authenticated) {
          router.replace('/login');
          return;
        }
        setUser(meData.user);

        const projRes = await fetch('/api/projects');
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData.projects || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    return VENUE_TEMPLATES.filter((t) => {
      if (selectedCategory !== 'All categories' && t.category !== selectedCategory)
        return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, templateSearch]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    return projects.filter((p) => {
      const isMine = p.isOwner ?? (p.accessRole === 'OWNER' || !p.accessRole);
      const isShared = p.visibility === 'shared' || (p.collaboratorCount ?? 0) > 0 || !isMine;
      if (projectFilter === 'mine' && !isMine) return false;
      if (projectFilter === 'shared' && !isShared) return false;
      if (projectFilter === 'pinned' && !p.isPinned) return false;
      if (q) {
        const hay = `${p.name} ${p.description || ''} ${p.templateId} ${(p.fileNames || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, projectFilter, projectSearch]);

  async function handleTogglePin(proj: ProjectSummary) {
    const nextPinned = !proj.isPinned;
    setProjects((prev) =>
      prev.map((p) => (p.id === proj.id ? { ...p, isPinned: nextPinned } : p))
    );
    await fetch(`/api/projects/${proj.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: nextPinned }),
    });
  }

  async function handleConfirmRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingProject || !renamingProject.name.trim()) return;
    const res = await fetch(`/api/projects/${renamingProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renamingProject.name.trim() }),
    });
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === renamingProject.id ? { ...p, name: renamingProject.name.trim() } : p
        )
      );
      setRenamingProject(null);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setCreating(true);
    try {
      const tpl = VENUE_TEMPLATES.find((t) => t.id === selectedTemplateId);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || tpl?.name || 'Untitled Manuscript',
          templateId: selectedTemplateId,
          format: tpl?.format || 'latex',
          texliveVersion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Could not create project.');
        setCreating(false);
        return;
      }
      router.push(`/app/projects/${data.project.id}`);
    } catch {
      setErrorMsg('Failed to create project.');
      setCreating(false);
    }
  }

  async function handleImportProject(e: React.FormEvent) {
    e.preventDefault();
    if (!importReviewStep) {
      const derived =
        importName.trim() ||
        githubUrl.split('/').filter(Boolean).pop()?.replace(/\.git$/, '') ||
        'Imported Research Project';
      setImportName(derived);
      setImportReviewStep(true);
      return;
    }
    setErrorMsg(null);
    setCreating(true);
    try {
      const derivedName =
        importName.trim() ||
        githubUrl.split('/').filter(Boolean).pop()?.replace(/\.git$/, '') ||
        'Imported Research Project';
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: derivedName,
          templateId: 'blank-latex',
          texliveVersion,
          gitRepoUrl: importSourceType === 'github' ? githubUrl : undefined,
          gitBranch: importSourceType === 'github' ? githubBranch : undefined,
          description:
            importSourceType === 'github'
              ? `Imported from GitHub: ${githubUrl} (${githubBranch})`
              : 'Imported from Archive (.zip)',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Import failed.');
        setCreating(false);
        return;
      }
      router.push(`/app/projects/${data.project.id}`);
    } catch {
      setErrorMsg('Network error during project import.');
      setCreating(false);
    }
  }

  async function handleDeleteProject(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9] text-sm text-[#575751]">
        Loading CorTeX workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a]">
      {/* Top App Bar */}
      <header className="border-b border-[#e2e2d8] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <CortexLogo href="/app" />
            <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-[#575751]">
              <Link href="/app" className="text-[#1c1c1a]">
                Workspace
              </Link>
              <Link href="/app/library" className="hover:text-[#1c1c1a]">
                Library
              </Link>
              <Link href="/gallery" className="hover:text-[#1c1c1a]">
                Gallery
              </Link>
              <Link href="/docs/en" className="hover:text-[#1c1c1a]">
                Docs
              </Link>
              {user?.role === 'Admin' ? (
                <Link
                  href="/sysop"
                  className="px-2.5 py-1 rounded bg-[#0d9488]/10 text-[#0d9488] text-xs font-semibold"
                >
                  Sysop Console
                </Link>
              ) : null}
            </nav>
          </div>

          {/* Account Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#d6d6cc] bg-[#fcfcf9] hover:bg-[#f4f4ee] text-xs font-medium"
            >
              <span className="w-6 h-6 rounded-full bg-[#1c1c1a] text-white flex items-center justify-center font-semibold">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline">{user?.name || user?.email}</span>
              <span className="px-1.5 py-0.5 rounded bg-[#eaeae2] text-[10px] uppercase font-semibold">
                {user?.role}
              </span>
            </button>

            {accountMenuOpen ? (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[#e2e2d8] bg-white shadow-xl py-2 z-40 text-xs">
                <div className="px-4 py-2 border-b border-[#e2e2d8]">
                  <div className="font-semibold text-[#1c1c1a] truncate">{user?.name}</div>
                  <div className="text-[#8a8a80] truncate">{user?.email}</div>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded bg-[#f4f4ee] text-[10px] font-medium uppercase">
                    Plan: {user?.planTier} · Role: {user?.role}
                  </div>
                </div>
                <Link
                  href="/app/settings/account"
                  className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                >
                  Account settings
                </Link>
                <Link
                  href="/app/settings/access"
                  className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                >
                  Passes and organizations
                </Link>
                <Link
                  href="/app/settings/billing"
                  className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                >
                  My plan and billing
                </Link>
                <Link
                  href="/app/settings/organizations"
                  className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                >
                  Organizations
                </Link>
                <Link
                  href="/app/settings/api-key"
                  className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                >
                  API connection (BYOK)
                </Link>
                <Link
                  href="/connect"
                  className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                >
                  Connect your agent
                </Link>
                <Link
                  href="/app/settings/labs"
                  className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                >
                  Labs
                </Link>
                <div className="border-t border-[#e2e2d8] my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setShortcutsModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                  >
                    Keyboard shortcuts
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setWhatsNewModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                  >
                    What&apos;s new
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setFeedbackSent(false);
                      setFeedbackModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f4f4ee] text-[#1c1c1a]"
                  >
                    Send feedback / Report a problem
                  </button>
                </div>
                {user?.role === 'Admin' ? (
                  <Link
                    href="/sysop"
                    className="block px-4 py-2 hover:bg-[#f4f4ee] text-[#0d9488] font-semibold"
                  >
                    Sysop Operator Console
                  </Link>
                ) : null}
                <div className="border-t border-[#e2e2d8] mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 font-medium"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Library Card Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-3">
            Library
          </h2>
          <Link
            href="/app/library"
            className="block p-6 rounded-xl border border-[#e2e2d8] bg-white hover:border-[#1c1c1a] transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif-academic text-xl font-semibold text-[#1c1c1a] group-hover:text-[#0d9488] transition-colors">
                  Research Library
                </h3>
                <p className="text-xs sm:text-sm text-[#575751] mt-1">
                  References · PDFs · Highlights & Sticky Notes · OpenAlex Discovery ·
                  One-Click BibTeX Citations
                </p>
              </div>
              <span className="text-sm font-medium text-[#1c1c1a] group-hover:translate-x-1 transition-transform">
                Open Library →
              </span>
            </div>
          </Link>
        </section>

        {/* Projects Section */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80]">
                Projects ({filteredProjects.length})
              </h2>
              <div className="inline-flex rounded-lg border border-[#d6d6cc] bg-white p-0.5 text-xs">
                {(['all', 'mine', 'shared', 'pinned'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    data-testid={`project-filter-${f}`}
                    onClick={() => setProjectFilter(f)}
                    className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                      projectFilter === f
                        ? 'bg-[#1c1c1a] text-white'
                        : 'text-[#575751] hover:text-[#1c1c1a]'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'mine' ? 'Mine' : f === 'shared' ? 'Shared' : 'Pinned'}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
                data-testid="project-search-input"
                className="px-3 py-1 rounded-md border border-[#d6d6cc] bg-white text-xs text-[#1c1c1a] w-48"
              />
            </div>

            {user?.role !== 'Viewer' ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setImportReviewStep(false);
                    setImportModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-md border border-[#d6d6cc] bg-white text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f4ee]"
                >
                  Import project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setNewProjectOpen(true);
                  }}
                  className="px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f] shadow-sm"
                >
                  + New project
                </button>
              </div>
            ) : (
              <span className="text-xs text-[#8a8a80] bg-[#f4f4ee] px-3 py-1 rounded">
                Viewer Role (Read-Only Access)
              </span>
            )}
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#c8c8bc] bg-white p-12 text-center">
              <h3 className="font-serif-academic text-xl font-semibold text-[#1c1c1a]">
                {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
              </h3>
              <p className="text-xs sm:text-sm text-[#575751] mt-2 max-w-md mx-auto">
                Start a blank LaTeX, Typst, Markdown, or Slide deck project, or choose
                from 104 official academic journal and conference templates (NeurIPS,
                ICML, IEEE, ACM, Nature, Springer, Oxford).
              </p>
              {user?.role !== 'Viewer' ? (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewProjectOpen(true)}
                    className="px-4 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
                  >
                    + New project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportReviewStep(false);
                      setImportModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-md border border-[#d6d6cc] bg-[#fcfcf9] text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f4ee]"
                  >
                    Import from GitHub or ZIP
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-xl border border-[#e2e2d8] bg-white hover:border-[#1c1c1a] transition-colors flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8a8a80]">
                      <span className="font-mono-code uppercase px-2 py-0.5 rounded bg-[#f4f4ee] text-[#1c1c1a] font-medium">
                        {proj.format} · {proj.templateId}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(proj)}
                          data-testid={`pin-project-${proj.id}`}
                          title={proj.isPinned ? 'Unpin project' : 'Pin project'}
                          className={`px-1.5 py-0.5 rounded text-xs ${
                            proj.isPinned
                              ? 'bg-amber-100 text-amber-800 font-semibold'
                              : 'hover:bg-[#f4f4ee] text-[#8a8a80]'
                          }`}
                        >
                          {proj.isPinned ? '★ Pinned' : '☆ Pin'}
                        </button>
                        <span>{proj.accessRole || (proj.isOwner ? 'OWNER' : 'COLLABORATOR')}</span>
                      </div>
                    </div>
                    <Link
                      href={`/app/projects/${proj.id}`}
                      className="block font-serif-academic text-xl font-semibold text-[#1c1c1a] hover:text-[#0d9488] mt-3"
                    >
                      {proj.name}
                    </Link>
                    {proj.description ? (
                      <p className="text-xs text-[#575751] mt-1">{proj.description}</p>
                    ) : null}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#e2e2d8] flex items-center justify-between text-xs text-[#575751]">
                    <span>
                      {(proj.memberCount ?? (proj.collaboratorCount ?? 0) + 1)} member
                      {(proj.memberCount ?? (proj.collaboratorCount ?? 0) + 1) > 1 ? 's' : ''} ·{' '}
                      {proj.fileCount ? `${proj.fileCount} files · ` : ''}Updated{' '}
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setRenamingProject({ id: proj.id, name: proj.name })}
                        className="text-[#8a8a80] hover:text-[#1c1c1a]"
                      >
                        Rename
                      </button>
                      {(proj.accessRole === 'OWNER' || proj.isOwner) ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="text-[#8a8a80] hover:text-red-700"
                        >
                          Trash
                        </button>
                      ) : null}
                      <Link
                        href={`/app/projects/${proj.id}`}
                        className="font-semibold text-[#1c1c1a] hover:underline"
                      >
                        Open →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* New Project Modal with 104 Venue Templates */}
      {newProjectOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#e2e2d8] flex items-center justify-between bg-[#f4f4ee]">
              <div>
                <h3 className="text-base font-semibold text-[#1c1c1a]">
                  Create New Academic Project
                </h3>
                <p className="text-xs text-[#575751]">
                  Choose from {VENUE_TEMPLATES.length} official journal, conference,
                  thesis, and multi-format templates
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewProjectOpen(false)}
                className="px-3 py-1 rounded bg-white border border-[#d6d6cc] text-xs"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="p-5 border-b border-[#e2e2d8] grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fcfcf9]">
                <div>
                  <label
                    htmlFor="new-project-name"
                    className="block text-xs font-medium text-[#1c1c1a] mb-1"
                  >
                    Project title
                  </label>
                  <input
                    id="new-project-name"
                    type="text"
                    placeholder="e.g., NeurIPS 2026 — Geodesic Attention"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#d6d6cc] text-sm bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="template-search"
                    className="block text-xs font-medium text-[#1c1c1a] mb-1"
                  >
                    Search {VENUE_TEMPLATES.length} venue templates
                  </label>
                  <input
                    id="template-search"
                    type="text"
                    placeholder="Search NeurIPS, IEEE, ACM, Nature, MIT, Beamer..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#d6d6cc] text-sm bg-white"
                  />
                </div>
              </div>

              {errorMsg ? (
                <div className="mx-5 mt-3 p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMsg}
                </div>
              ) : null}

              {/* Category Filter Pills */}
              <div className="px-5 py-2.5 border-b border-[#e2e2d8] flex items-center gap-1.5 overflow-x-auto bg-white">
                {VENUE_TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-[#1c1c1a] text-white'
                        : 'bg-[#f4f4ee] text-[#575751] hover:text-[#1c1c1a]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#fafaf6]">
                {filteredTemplates.map((tpl) => {
                  const selected = tpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`text-left p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                        selected
                          ? 'border-[#1c1c1a] bg-white ring-2 ring-[#1c1c1a]/15'
                          : 'border-[#e2e2d8] bg-white hover:border-[#8a8a80]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase">
                          <span className="text-[#0d9488]">{tpl.category}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#f4f4ee] text-[#1c1c1a]">
                            {tpl.format}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#1c1c1a] mt-1.5">
                          {tpl.name}
                        </div>
                        <div className="text-[11px] text-[#575751] mt-1 line-clamp-2">
                          {tpl.description}
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#f0f0e8] text-[10px] text-[#8a8a80] flex justify-between">
                        <span>{tpl.badge}</span>
                        <span>{tpl.columns}-col</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-6 py-3.5 border-t border-[#e2e2d8] bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#575751]">
                  <span>
                    Selected template:{' '}
                    <strong className="text-[#1c1c1a]">
                      {VENUE_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}
                    </strong>
                  </span>
                  <label className="inline-flex items-center gap-1.5">
                    <span>TeX Live version:</span>
                    <select
                      value={texliveVersion}
                      onChange={(e) => setTexliveVersion(e.target.value)}
                      className="rounded border border-[#d6d6cc] bg-[#fcfcf9] px-2 py-1 text-xs text-[#1c1c1a]"
                    >
                      <option value="tl2026-20260826-b6584b4">TeX Live 2026 (tl2026)</option>
                      <option value="tl2025">TeX Live 2025</option>
                      <option value="tl2024">TeX Live 2024</option>
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f] disabled:opacity-50"
                >
                  {creating ? 'Creating workspace...' : 'Create project →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Import Project & Import Review Modal */}
      {importModalOpen ? (
        <div
          data-ui="import-review-dialog"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e2d8]">
              <h3 className="text-base font-semibold text-[#1c1c1a]">
                {importReviewStep ? 'Review imported project' : 'Import Project'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setImportReviewStep(false);
                  setImportModalOpen(false);
                }}
                className="text-xs text-[#575751]"
              >
                ✕
              </button>
            </div>

            {!importReviewStep ? (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportSourceType('github')}
                  className={`flex-1 py-1.5 rounded text-xs font-medium ${
                    importSourceType === 'github'
                      ? 'bg-[#1c1c1a] text-white'
                      : 'bg-[#f4f4ee] text-[#575751]'
                  }`}
                >
                  From GitHub Repository
                </button>
                <button
                  type="button"
                  onClick={() => setImportSourceType('zip')}
                  className={`flex-1 py-1.5 rounded text-xs font-medium ${
                    importSourceType === 'zip'
                      ? 'bg-[#1c1c1a] text-white'
                      : 'bg-[#f4f4ee] text-[#575751]'
                  }`}
                >
                  Upload Archive (.zip)
                </button>
              </div>
            ) : null}

            <form onSubmit={handleImportProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1c1c1a] mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Imported LaTeX Manuscript"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#d6d6cc] text-sm"
                />
              </div>

              {!importReviewStep ? (
                importSourceType === 'github' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1c1c1a] mb-1">
                        GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://github.com/org/paper-repo"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-[#d6d6cc] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1c1c1a] mb-1">
                        Branch or Tag (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="main"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-[#d6d6cc] text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-[#1c1c1a] mb-1">
                      Select .zip Archive (Overleaf or TeX bundle)
                    </label>
                    <input
                      type="file"
                      accept=".zip"
                      className="w-full text-xs text-[#575751]"
                    />
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-[#e2e2d8] bg-[#fcfcf9] p-4 space-y-3 text-xs">
                  <p className="text-[#575751]">
                    Confirm the project settings before creating the project.
                  </p>
                  <dl className="divide-y divide-[#e2e2d8]">
                    <div className="py-1.5 flex justify-between">
                      <dt className="text-[#575751]">Source</dt>
                      <dd className="font-medium text-[#1c1c1a]">
                        {importSourceType === 'github'
                          ? `${githubUrl || 'github.com/corca-ai/paper'} (${githubBranch || 'main'})`
                          : 'Archive (.zip)'}
                      </dd>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <dt className="text-[#575751]">Normalized root</dt>
                      <dd className="font-mono text-[#1c1c1a]">
                        {(importName || 'manuscript').toLowerCase().replace(/\s+/g, '-')}/
                      </dd>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <dt className="text-[#575751]">Files</dt>
                      <dd className="font-medium text-[#1c1c1a]">3 files · 14.2 KB</dd>
                    </div>
                    <div className="py-1.5 flex justify-between items-center">
                      <dt className="text-[#575751]">Main TeX file</dt>
                      <dd>
                        <select
                          value={importMainTex}
                          onChange={(e) => setImportMainTex(e.target.value)}
                          className="rounded border border-[#d6d6cc] bg-white px-2 py-0.5 font-mono text-xs"
                        >
                          <option value="main.tex">main.tex</option>
                          <option value="paper.tex">paper.tex</option>
                          <option value="supplement.tex">supplement.tex</option>
                        </select>
                      </dd>
                    </div>
                    <div className="py-1.5 flex justify-between items-center">
                      <dt className="text-[#575751]">TeX Live version</dt>
                      <dd>
                        <select
                          value={texliveVersion}
                          onChange={(e) => setTexliveVersion(e.target.value)}
                          className="rounded border border-[#d6d6cc] bg-white px-2 py-0.5 text-xs"
                        >
                          <option value="tl2026-20260826-b6584b4">2026 (Default)</option>
                          <option value="tl2025">2025</option>
                          <option value="tl2024">2024</option>
                        </select>
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {importReviewStep ? (
                  <button
                    type="button"
                    onClick={() => setImportReviewStep(false)}
                    className="px-3.5 py-1.5 rounded border border-[#d6d6cc] text-xs"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-3.5 py-1.5 rounded border border-[#d6d6cc] text-xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={creating}
                  data-testid="confirm-import-project-btn"
                  className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                >
                  {creating
                    ? 'Creating project...'
                    : importReviewStep
                    ? 'Create project'
                    : 'Review import →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Rename Project Modal */}
      {renamingProject ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmRename}
            className="bg-white rounded-xl border border-[#e2e2d8] max-w-sm w-full p-5 shadow-xl space-y-4"
          >
            <h3 className="text-sm font-semibold text-[#1c1c1a]">Rename project</h3>
            <input
              type="text"
              required
              value={renamingProject.name}
              onChange={(e) =>
                setRenamingProject({ ...renamingProject, name: e.target.value })
              }
              className="w-full px-3 py-2 rounded border border-[#d6d6cc] text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingProject(null)}
                className="px-3 py-1.5 rounded border border-[#d6d6cc] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Keyboard Shortcuts Modal */}
      {shortcutsModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e2d8]">
              <h3 className="text-base font-semibold text-[#1c1c1a]">Keyboard shortcuts</h3>
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                className="text-xs text-[#575751]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              {[
                ['Quick open file', '⌘P / Ctrl+P'],
                ['Search in project', '⌘⇧F / Ctrl+Shift+F'],
                ['Ask Orca AI / Edit selection', '⌘K / Ctrl+K'],
                ['Academic Phrasebank trigger', '/ (at start of line)'],
                ['Compile / Typeset document', '⌘S / Ctrl+S'],
                ['Find in current file', '⌘F / Ctrl+F'],
              ].map(([label, keys]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1.5 border-b border-[#f0f0e8]"
                >
                  <span className="text-[#1c1c1a]">{label}</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#f4f4ee] border border-[#d6d6cc] font-mono text-[11px]">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* What's New Modal */}
      {whatsNewModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e2d8]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0d9488]">
                  CorTeX Open Beta
                </span>
                <h3 className="text-base font-semibold text-[#1c1c1a]">
                  Welcome to CorTeX Open Beta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWhatsNewModalOpen(false)}
                className="text-xs text-[#575751]"
              >
                Got it
              </button>
            </div>
            <ul className="space-y-2.5 text-xs text-[#575751] list-disc pl-4">
              <li>
                <strong className="text-[#1c1c1a]">104 Official Venue Templates:</strong>{' '}
                Instant setup for NeurIPS, ICML, ICLR, ACL, IEEE, ACM, Nature, Springer, and Beamer.
              </li>
              <li>
                <strong className="text-[#1c1c1a]">Accessible PDF & Section Export:</strong>{' '}
                Run PDF/UA-2 preflight checks, inspect tagged structure, or export individual manuscript sections.
              </li>
              <li>
                <strong className="text-[#1c1c1a]">Connected Local Agent (/connect):</strong>{' '}
                Use CorTeX&apos;s interface while AI work runs on a relay agent on your computer.
              </li>
              <li>
                <strong className="text-[#1c1c1a]">3-Pane Research Library & Notebook:</strong>{' '}
                Explore citation graphs, annotate PDFs, and link Markdown research notes with{' '}
                <code>[[citeKey#mark]]</code>.
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* Send Feedback / Report a Problem Modal */}
      {feedbackModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e2d8]">
              <h3 className="text-base font-semibold text-[#1c1c1a]">
                Send feedback or report a problem
              </h3>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="text-xs text-[#575751]"
              >
                Close
              </button>
            </div>
            {feedbackSent ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-sm font-semibold text-[#0d9488]">
                  Thank you — your feedback has been sent.
                </p>
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFeedbackSent(true);
                  setFeedbackMessage('');
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-medium text-[#1c1c1a] mb-1">Category</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) =>
                      setFeedbackCategory(
                        e.target.value as 'bug' | 'latex' | 'feature' | 'general'
                      )
                    }
                    className="w-full rounded border border-[#d6d6cc] px-2.5 py-1.5 text-xs"
                  >
                    <option value="bug">Bug or broken behavior</option>
                    <option value="latex">LaTeX or PDF issue</option>
                    <option value="feature">Feature request</option>
                    <option value="general">General feedback</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#1c1c1a] mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="What happened, or what would help?"
                    className="w-full rounded border border-[#d6d6cc] p-2.5 text-xs"
                  />
                </div>
                {includeEnvDetails ? (
                  <div className="rounded border border-[#e2e2d8] bg-[#fcfcf9] p-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-[#575751]">
                      Environment details included (CorTeX v1.0 · TeX Live 2026)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludeEnvDetails(false)}
                      className="text-[11px] text-[#8a8a80] hover:text-[#1c1c1a]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIncludeEnvDetails(true)}
                    className="text-[11px] text-[#0d9488] hover:underline"
                  >
                    Include environment details
                  </button>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackModalOpen(false)}
                    className="px-3 py-1.5 rounded border border-[#d6d6cc]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
                  >
                    Send feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
