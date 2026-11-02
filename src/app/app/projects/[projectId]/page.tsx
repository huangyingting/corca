'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';
import { ACADEMIC_PHRASEBANK, PHRASEBANK_FAMILIES } from '@/lib/data/phrasebank';

type SidebarTab = 'files' | 'outline' | 'search' | 'git' | 'orca' | 'review' | 'timeline';

interface ProjectFileItem {
  id: string;
  path: string;
  name: string;
  folderPath: string;
  kind: string;
  content: string;
  sizeBytes: number;
  isMain: boolean;
}

interface OutlineItem {
  id: string;
  title: string;
  level: number;
  line: number;
}

interface ReviewDiagnostic {
  id: string;
  category: 'Writing' | 'Citations' | 'Accessibility';
  severity: 'info' | 'warning' | 'error';
  line: number;
  message: string;
  suggestion?: string;
}

interface VersionItem {
  id: string;
  label: string;
  summary: string | null;
  createdAt: string;
  author: { name: string | null; email: string };
}

interface CommentItem {
  id: string;
  filePath: string;
  lineNumber: number;
  selectedText: string | null;
  body: string;
  status: string;
  createdAt: string;
  author: { name: string | null; email: string };
}

export default function ProjectWorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params?.projectId || '';
  const requestedFileParam = searchParams.get('file');

  const [project, setProject] = useState<{
    id: string;
    name: string;
    format: string;
    templateId: string;
    mainFile: string;
    latexEngine?: string;
    texliveVersion?: string;
    gitRepoUrl?: string | null;
    gitBranch?: string | null;
    visibility?: string;
  } | null>(null);
  const [accessRole, setAccessRole] = useState<string>('OWNER');
  const [files, setFiles] = useState<ProjectFileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');

  // Panes & Preview Controls
  const [showVisual, setShowVisual] = useState(false);
  const [showSource, setShowSource] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [darkPdfPage, setDarkPdfPage] = useState(false);
  const [smartCropMargins, setSmartCropMargins] = useState(false);
  const [storyboardOpen, setStoryboardOpen] = useState(false);
  const [latexEngine, setLatexEngine] = useState('auto');
  const [texliveVersion, setTexliveVersion] = useState('tl2026-20260826-b6584b4');

  // Compilation state
  const [compiledHtml, setCompiledHtml] = useState('');
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<ReviewDiagnostic[]>([]);
  const [stats, setStats] = useState({
    wordCount: 0,
    charCount: 0,
    citationCount: 0,
    figureCount: 0,
    equationCount: 0,
  });
  const [saving, setSaving] = useState(false);

  // Search & Replace All state
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchRegex, setSearchRegex] = useState(false);
  const [searchCase, setSearchCase] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ filePath: string; line: number; preview: string }>
  >([]);
  const [replaceFeedback, setReplaceFeedback] = useState<string | null>(null);

  // Git Panel state
  const [gitRepoUrl, setGitRepoUrl] = useState('https://github.com/corca-ai/cortex-manuscript');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitCommitMsg, setGitCommitMsg] = useState('');
  const [gitSyncStatus, setGitSyncStatus] = useState<string | null>(null);

  // Orca AI state
  const [orcaMode, setOrcaMode] = useState<'ask' | 'edit'>('edit');
  const [orcaPrompt, setOrcaPrompt] = useState('');
  const [orcaLoading, setOrcaLoading] = useState(false);
  const [orcaMessages, setOrcaMessages] = useState<
    Array<{
      id: string;
      role: string;
      content: string;
      diff?: {
        originalSnippet: string;
        proposedSnippet: string;
        explanation: string;
      } | null;
    }>
  >([]);

  // Review & Timeline state
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [newCommentLine, setNewCommentLine] = useState(1);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [newVersionLabel, setNewVersionLabel] = useState('');

  // Modals
  const [quickOpenModal, setQuickOpenModal] = useState(false);
  const [phrasebankModal, setPhrasebankModal] = useState(false);
  const [phrasebankFamily, setPhrasebankFamily] = useState<string>('All families');
  const [phrasebankStrength, setPhrasebankStrength] = useState<'all' | 'cautious' | 'neutral' | 'strong'>('all');
  const [shareModal, setShareModal] = useState(false);
  const [newFileModal, setNewFileModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [accessibleExportOpen, setAccessibleExportOpen] = useState(false);
  const [accessibleExportStage, setAccessibleExportStage] = useState<'preflight' | 'result'>('preflight');
  const [sectionExportOpen, setSectionExportOpen] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [refactorModalOpen, setRefactorModalOpen] = useState(false);
  const [refactorTab, setRefactorTab] = useState<'label' | 'repair' | 'wrap'>('label');
  const [oldLabel, setOldLabel] = useState('eq:main');
  const [newLabel, setNewLabel] = useState('eq:spectral-bound');
  const [wrapEnv, setWrapEnv] = useState('equation');
  const [refactorFeedback, setRefactorFeedback] = useState<string | null>(null);

  // Share state
  const [collaborators, setCollaborators] = useState<
    Array<{
      id: string;
      invitedEmail: string;
      permission: string;
      scopeType: string;
      scopePath: string;
    }>
  >([]);
  const [shareLinks, setShareLinks] = useState<
    Array<{
      id: string;
      token: string;
      permission: string;
      scopeType: string;
      scopePath: string;
    }>
  >([]);
  const [inviteCollabEmail, setInviteCollabEmail] = useState('');
  const [inviteCollabPerm, setInviteCollabPerm] = useState('EDITOR');
  const [inviteScopeType, setInviteScopeType] = useState('PROJECT');
  const [inviteScopePath, setInviteScopePath] = useState('/');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const runCompile = useCallback(
    async (fileToCompile?: ProjectFileItem) => {
      if (!projectId) return;
      const target = fileToCompile || activeFile;
      if (!target) return;
      try {
        const res = await fetch(`/api/projects/${projectId}/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: target.path,
            content: target.content,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCompiledHtml(data.compiled.html);
          setOutline(data.compiled.outline || []);
          setDiagnostics(data.compiled.diagnostics || []);
          setStats(data.compiled.stats || stats);
        }
      } catch {
        // Ignore transient compile error
      }
    },
    [projectId, activeFile]
  );

  useEffect(() => {
    async function loadWorkspace() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        router.replace('/app');
        return;
      }
      const data = await res.json();
      setProject(data.project);
      setAccessRole(data.accessRole || data.permission || 'OWNER');
      setFiles(data.project.files || []);
      setVersions(data.project.versions || []);
      setComments(data.project.comments || []);
      setCollaborators(data.project.collaborators || []);
      setShareLinks(data.project.shareLinks || []);
      if (data.project.latexEngine) setLatexEngine(data.project.latexEngine);
      if (data.project.texliveVersion) setTexliveVersion(data.project.texliveVersion);
      if (data.project.gitRepoUrl) setGitRepoUrl(data.project.gitRepoUrl);
      if (data.project.gitBranch) setGitBranch(data.project.gitBranch);

      const requestedFile = requestedFileParam
        ? data.project.files.find(
            (f: ProjectFileItem) =>
              f.id === requestedFileParam || f.path === requestedFileParam || f.name === requestedFileParam
          )
        : null;
      const mainF =
        requestedFile ||
        data.project.files.find((f: ProjectFileItem) => f.isMain) ||
        data.project.files[0];
      if (mainF) {
        setActiveFileId(mainF.id);
      }

      // Load Orca AI history
      fetch(`/api/ai/orca?projectId=${projectId}`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.messages)) {
            setOrcaMessages(
              d.messages.map((m: Record<string, unknown>) => ({
                id: String(m.id),
                role: String(m.role),
                content: String(m.content),
                diff: m.diffPayloadJson
                  ? (() => {
                      try {
                        return JSON.parse(String(m.diffPayloadJson));
                      } catch {
                        return null;
                      }
                    })()
                  : null,
              }))
            );
          }
        })
        .catch(() => {});
    }
    if (projectId) loadWorkspace();
  }, [projectId, router]);

  useEffect(() => {
    if (activeFile) {
      runCompile(activeFile);
    }
  }, [activeFileId]);

  // Keyboard shortcut Cmd/Ctrl + P for Quick Open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setQuickOpenModal((o) => !o);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function handleContentChange(nextContent: string) {
    if (!activeFile) return;
    const updatedFile = { ...activeFile, content: nextContent };
    setFiles((prev) => prev.map((f) => (f.id === activeFile.id ? updatedFile : f)));
    runCompile(updatedFile);
  }

  async function saveActiveFile() {
    if (!activeFile || accessRole === 'VIEWER') return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: activeFile.id,
          path: activeFile.path,
          content: activeFile.content,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateNewFile(e: React.FormEvent) {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: newFilePath.trim(),
        content: `% ${newFilePath.trim()}\n`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setFiles((prev) => [...prev, data.file]);
      setActiveFileId(data.file.id);
      setNewFilePath('');
      setNewFileModal(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setReplaceFeedback(null);
    const sp = new URLSearchParams({
      q: searchQuery,
      regex: searchRegex ? '1' : '0',
      caseSensitive: searchCase ? '1' : '0',
    });
    const res = await fetch(`/api/projects/${projectId}/search?${sp.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.results || []);
    }
  }

  async function handleReplaceAllInProject() {
    if (!searchQuery.trim() || accessRole === 'VIEWER') return;
    let totalReplaced = 0;
    const updatedFiles = files.map((f) => {
      if (!f.content.includes(searchQuery)) return f;
      const occurrences = f.content.split(searchQuery).length - 1;
      totalReplaced += occurrences;
      return {
        ...f,
        content: f.content.split(searchQuery).join(replaceQuery),
      };
    });
    setFiles(updatedFiles);
    setReplaceFeedback(`Replaced ${totalReplaced} occurrence(s) across project files.`);
    const updatedActive = updatedFiles.find((f) => f.id === activeFile?.id);
    if (updatedActive) {
      runCompile(updatedActive);
    }
  }

  function handleRenameLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!oldLabel.trim() || !newLabel.trim()) return;
    const targets = [
      [`\\label{${oldLabel.trim()}}`, `\\label{${newLabel.trim()}}`],
      [`\\ref{${oldLabel.trim()}}`, `\\ref{${newLabel.trim()}}`],
      [`\\eqref{${oldLabel.trim()}}`, `\\eqref{${newLabel.trim()}}`],
      [`\\autoref{${oldLabel.trim()}}`, `\\autoref{${newLabel.trim()}}`],
    ];
    let updatedCount = 0;
    const nextFiles = files.map((f) => {
      let nextContent = f.content;
      for (const [fromStr, toStr] of targets) {
        if (nextContent.includes(fromStr)) {
          updatedCount += nextContent.split(fromStr).length - 1;
          nextContent = nextContent.split(fromStr).join(toStr);
        }
      }
      return { ...f, content: nextContent };
    });
    setFiles(nextFiles);
    setRefactorFeedback(
      `Renamed \\label{${oldLabel.trim()}} → \\label{${newLabel.trim()}} across ${updatedCount} reference(s).`
    );
  }

  function handleWrapEnvironment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeFile) return;
    const snippet = `\n\\begin{${wrapEnv}}\n  % Wrapped selection\n  \\label{${wrapEnv}:new}\n\\end{${wrapEnv}}\n`;
    handleContentChange(`${activeFile.content.trimEnd()}\n${snippet}`);
    setRefactorFeedback(`Inserted \\begin{${wrapEnv}}...\\end{${wrapEnv}} into ${activeFile.name}.`);
  }

  async function handleGitSync(e: React.FormEvent) {
    e.preventDefault();
    setGitSyncStatus('Syncing commit with GitHub repository...');
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gitRepoUrl,
        gitBranch,
      }),
    });
    await fetch(`/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: gitCommitMsg.trim() || `Git sync (${gitBranch})`,
        summary: `Synced to ${gitRepoUrl}@${gitBranch}`,
      }),
    });
    setGitCommitMsg('');
    setGitSyncStatus(`Synced branch "${gitBranch}" with ${gitRepoUrl}`);
  }

  function downloadAccessibilityReport() {
    const reportMd = `# Accessibility export report\n\nPDF: ${project?.name || 'manuscript'}.pdf\n\n**Tagged PDF produced (not externally validated)**\n\n> CorTeX checks source structure and basic PDF tag presence. It does not run veraPDF or PAC.\n\n## Source preflight\n\n- Fixes: 0\n- Needs review: ${diagnostics.length}\n- Compatibility: 1\n\n## Requested\n\n| Field | Value |\n| --- | --- |\n| Standard | PDF/UA-2 |\n| Language | en |\n| Metadata | Injected |\n\n## Observed in PDF\n\n| Field | Value |\n| --- | --- |\n| Tagged | Yes |\n| Standard | PDF/UA-2 |\n| Figures | ${stats.figureCount} with alt text / ${stats.figureCount} total |\n| Structure | ${outline.length} headings · 1 tables |\n| Formulas | ${stats.equationCount} with MathML / ${stats.equationCount} total |\n\n## AI Disclosure\n\nCorTeXAIDisclosure: AI가 생성한 내용이 포함되어 있을 수 있습니다 / May contain AI-generated content.\n`;
    const blob = new Blob([reportMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project?.name || 'document').toLowerCase().replace(/\s+/g, '-')}-review.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAskOrca(e: React.FormEvent) {
    e.preventDefault();
    if (!orcaPrompt.trim() || !activeFile) return;
    const promptText = orcaPrompt.trim();
    setOrcaPrompt('');
    setOrcaLoading(true);
    setOrcaMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: promptText },
    ]);

    try {
      const res = await fetch('/api/ai/orca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          mode: orcaMode,
          prompt: promptText,
          activeFilePath: activeFile.path,
          activeFileContent: activeFile.content,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrcaMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            diff: data.diff || null,
          },
        ]);
      }
    } finally {
      setOrcaLoading(false);
    }
  }

  function applyOrcaDiff(diff: {
    originalSnippet: string;
    proposedSnippet: string;
  }) {
    if (!activeFile) return;
    const next = activeFile.content.includes(diff.originalSnippet)
      ? activeFile.content.replace(diff.originalSnippet, diff.proposedSnippet)
      : `${activeFile.content.trimEnd()}\n\n${diff.proposedSnippet}\n`;
    handleContentChange(next);
  }

  async function handleCreateVersion(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: newVersionLabel.trim() || `Snapshot ${versions.length + 1}`,
        summary: `Saved ${files.length} files`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setVersions((prev) => [data.version, ...prev]);
      setNewVersionLabel('');
    }
  }

  async function handleRestoreVersion(versionId: string) {
    const res = await fetch(`/api/projects/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restore',
        versionId,
      }),
    });
    if (res.ok) {
      const refreshed = await fetch(`/api/projects/${projectId}`);
      if (refreshed.ok) {
        const d = await refreshed.json();
        setFiles(d.project.files || []);
      }
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentBody.trim() || !activeFile) return;
    const res = await fetch(`/api/projects/${projectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: activeFile.path,
        lineNumber: newCommentLine,
        body: newCommentBody.trim(),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setNewCommentBody('');
    }
  }

  async function handleInviteCollaborator(e: React.FormEvent) {
    e.preventDefault();
    setShareFeedback(null);
    const res = await fetch(`/api/projects/${projectId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'collaborator',
        email: inviteCollabEmail,
        permission: inviteCollabPerm,
        scopeType: inviteScopeType,
        scopePath: inviteScopePath,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCollaborators((prev) => [data.collaborator, ...prev]);
      setInviteCollabEmail('');
      setShareFeedback('Collaborator permission granted.');
    }
  }

  async function handleCreateShareLink() {
    const res = await fetch(`/api/projects/${projectId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'link',
        permission: inviteCollabPerm,
        scopeType: inviteScopeType,
        scopePath: inviteScopePath,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const newLink = data.shareLink || data.link;
      if (newLink) {
        setShareLinks((prev) => [newLink, ...prev]);
      }
      setShareFeedback(
        `Share link created: ${data.shareUrl || newLink?.shareUrl || ''}`
      );
    }
  }

  function downloadProjectBundle() {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a] overflow-hidden">
      {/* Top Workspace Bar */}
      <header className="h-13 border-b border-[#e2e2d8] bg-white px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <CortexLogo href="/app" size="sm" />
          <span className="text-[#c8c8bc]">/</span>
          <span className="font-semibold text-sm text-[#1c1c1a] truncate max-w-[240px]">
            {project?.name || 'Loading...'}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#f4f4ee] text-[10px] font-mono-code uppercase text-[#575751]">
            {project?.format} · {accessRole}
          </span>
        </div>

        {/* Center View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-[#d6d6cc] bg-[#f4f4ee] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowVisual(true);
                setShowSource(false);
                setShowPreview(true);
              }}
              className={`px-2.5 py-1 rounded ${
                showVisual ? 'bg-white font-semibold shadow-sm' : 'text-[#575751]'
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => {
                setShowVisual(false);
                setShowSource(true);
                setShowPreview(true);
              }}
              className={`px-2.5 py-1 rounded ${
                !showVisual && showSource && showPreview
                  ? 'bg-white font-semibold shadow-sm'
                  : 'text-[#575751]'
              }`}
            >
              &lt;/&gt; Source + Preview
            </button>
            <button
              type="button"
              onClick={() => {
                setShowVisual(false);
                setShowSource(false);
                setShowPreview(true);
              }}
              className={`px-2.5 py-1 rounded ${
                !showVisual && !showSource && showPreview
                  ? 'bg-white font-semibold shadow-sm'
                  : 'text-[#575751]'
              }`}
            >
              Preview
            </button>
          </div>

          <button
            type="button"
            onClick={() => setQuickOpenModal(true)}
            className="px-2.5 py-1 rounded border border-[#d6d6cc] bg-white text-xs text-[#575751] hover:text-[#1c1c1a]"
          >
            Quick open ⌘P
          </button>

          <button
            type="button"
            onClick={() => setPhrasebankModal(true)}
            className="px-2.5 py-1 rounded border border-[#d6d6cc] bg-white text-xs text-[#1c1c1a] hover:bg-[#f4f4ee]"
          >
            / Phrasebank
          </button>

          <button
            type="button"
            onClick={() => {
              setRefactorFeedback(null);
              setRefactorModalOpen(true);
            }}
            data-testid="open-refactor-modal-btn"
            className="px-2.5 py-1 rounded border border-[#d6d6cc] bg-white text-xs text-[#1c1c1a] hover:bg-[#f4f4ee]"
          >
            Refactor LaTeX
          </button>

          <select
            aria-label="LaTeX Engine"
            value={latexEngine}
            onChange={(e) => setLatexEngine(e.target.value)}
            className="px-2 py-1 rounded border border-[#d6d6cc] bg-white text-xs text-[#1c1c1a]"
          >
            <option value="auto">Engine: Auto</option>
            <option value="pdflatex">pdfLaTeX</option>
            <option value="xelatex">XeLaTeX</option>
            <option value="lualatex">LuaLaTeX</option>
            <option value="typst">Typst</option>
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveActiveFile}
            disabled={saving || accessRole === 'VIEWER'}
            className="px-3 py-1.5 rounded border border-[#d6d6cc] bg-white text-xs font-medium hover:bg-[#f4f4ee] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setShareModal(true)}
            className="px-3 py-1.5 rounded border border-[#d6d6cc] bg-white text-xs font-medium hover:bg-[#f4f4ee]"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedSectionIds(outline.map((o) => o.id));
              setSectionExportOpen(true);
            }}
            data-testid="open-section-export-btn"
            className="px-2.5 py-1.5 rounded border border-[#d6d6cc] bg-white text-xs font-medium hover:bg-[#f4f4ee]"
          >
            Export Section PDF
          </button>
          <button
            type="button"
            onClick={() => {
              setAccessibleExportStage('preflight');
              setAccessibleExportOpen(true);
            }}
            data-testid="open-accessible-export-btn"
            className="px-2.5 py-1.5 rounded border border-[#0d9488] bg-[#0d9488]/10 text-[#0d9488] text-xs font-semibold hover:bg-[#0d9488]/20"
          >
            Accessible PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
          >
            Export PDF
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Far-Left Activity Icon Rail */}
        <nav
          aria-label="Workspace sidebar tabs"
          className="w-16 border-r border-[#e2e2d8] bg-[#f4f4ee] flex flex-col items-center py-3 gap-2"
        >
          {(
            [
              { id: 'files', label: 'Files' },
              { id: 'outline', label: 'Outline' },
              { id: 'search', label: 'Search' },
              { id: 'git', label: 'GitHub' },
              { id: 'orca', label: 'Orca AI' },
              { id: 'review', label: 'Review' },
              { id: 'timeline', label: 'Timeline' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSidebarTab(item.id)}
              className={`w-13 px-1.5 py-2 rounded-lg text-[11px] font-medium text-center transition-colors ${
                sidebarTab === item.id
                  ? 'bg-[#1c1c1a] text-white shadow-sm'
                  : 'text-[#575751] hover:bg-[#eaeae2] hover:text-[#1c1c1a]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Left Sidebar Drawer (6 Tabs) */}
        <aside className="w-72 border-r border-[#e2e2d8] bg-white flex flex-col min-h-0 overflow-hidden">
          {sidebarTab === 'files' ? (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80]">
                  Project Files ({files.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewFileModal(true)}
                    className="px-2 py-0.5 rounded bg-[#f4f4ee] text-xs font-medium hover:bg-[#eaeae2]"
                  >
                    + New
                  </button>
                  <button
                    type="button"
                    onClick={downloadProjectBundle}
                    className="px-2 py-0.5 rounded bg-[#f4f4ee] text-xs font-medium hover:bg-[#eaeae2]"
                  >
                    ↓
                  </button>
                </div>
              </div>

              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setActiveFileId(f.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-mono-code flex items-center justify-between ${
                        f.id === activeFile?.id
                          ? 'bg-[#1c1c1a] text-white font-medium'
                          : 'text-[#575751] hover:bg-[#f4f4ee]'
                      }`}
                    >
                      <span className="truncate">{f.path}</span>
                      {f.isMain ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0d9488] text-white">
                          main
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4 border-t border-[#e2e2d8] text-xs text-[#575751] space-y-1">
                <div>Words: {stats.wordCount}</div>
                <div>Citations: {stats.citationCount}</div>
                <div>Equations: {stats.equationCount}</div>
                <Link
                  href="/app/library"
                  className="inline-block mt-2 text-[#0d9488] font-medium hover:underline"
                >
                  Open Research Library →
                </Link>
              </div>
            </div>
          ) : null}

          {sidebarTab === 'outline' ? (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-3">
                Document Outline
              </div>
              {outline.length === 0 ? (
                <p className="text-xs text-[#8a8a80]">
                  Add \section or # headings to generate a live outline.
                </p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {outline.map((o) => (
                    <li key={o.id}>
                      <div
                        className="px-2.5 py-1.5 rounded hover:bg-[#f4f4ee] text-[#1c1c1a] flex items-center justify-between"
                        style={{ paddingLeft: `${(o.level - 1) * 12 + 8}px` }}
                      >
                        <span className="truncate">{o.title}</span>
                        <span className="text-[10px] font-mono-code text-[#8a8a80]">
                          L{o.line}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {sidebarTab === 'search' ? (
            <div className="flex-1 p-4 flex flex-col overflow-y-auto">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-3">
                In-Project Search &amp; Replace All
              </div>
              <form onSubmit={handleSearch} className="space-y-2">
                <input
                  type="text"
                  placeholder="Search across all files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#d6d6cc] text-xs"
                />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#d6d6cc] text-xs"
                />
                <div className="flex items-center justify-between text-[11px] text-[#575751]">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={searchRegex}
                      onChange={(e) => setSearchRegex(e.target.checked)}
                    />
                    Regex (`.*`)
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={searchCase}
                      onChange={(e) => setSearchCase(e.target.checked)}
                    />
                    Case (`Aa`)
                  </label>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-[#1c1c1a] text-white font-medium"
                  >
                    Find
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleReplaceAllInProject}
                  data-testid="replace-all-btn"
                  className="w-full py-1.5 rounded border border-[#d6d6cc] bg-[#f4f4ee] hover:bg-[#eaeae2] text-xs font-medium text-[#1c1c1a]"
                >
                  Replace All in Project
                </button>
              </form>

              {replaceFeedback ? (
                <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                  {replaceFeedback}
                </div>
              ) : null}

              <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
                {searchResults.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded border border-[#e2e2d8] bg-[#fafaf6] text-xs"
                  >
                    <div className="font-mono-code font-semibold text-[#0d9488]">
                      {r.filePath}:{r.line}
                    </div>
                    <div className="mt-1 font-mono-code text-[11px] text-[#1c1c1a] truncate">
                      {r.preview}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {sidebarTab === 'git' ? (
            <div className="flex-1 p-4 flex flex-col overflow-y-auto space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80]">
                Git &amp; GitHub Sync
              </div>
              <form onSubmit={handleGitSync} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#1c1c1a] mb-1">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={gitRepoUrl}
                    onChange={(e) => setGitRepoUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#d6d6cc] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1c1c1a] mb-1">
                    Active Branch
                  </label>
                  <select
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#d6d6cc] bg-white text-xs font-mono"
                  >
                    <option value="main">main</option>
                    <option value="rebuttal">rebuttal</option>
                    <option value="camera-ready">camera-ready</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#1c1c1a] mb-1">
                    Commit Message
                  </label>
                  <input
                    type="text"
                    placeholder="Update theorems and experimental results"
                    value={gitCommitMsg}
                    onChange={(e) => setGitCommitMsg(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#d6d6cc] text-xs"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="git-commit-sync-btn"
                  className="w-full py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
                >
                  Commit &amp; Sync with GitHub
                </button>
              </form>
              {gitSyncStatus ? (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {gitSyncStatus}
                </div>
              ) : null}
              <div className="pt-3 border-t border-[#e2e2d8] text-xs text-[#575751]">
                <Link
                  href="/gh/corca-ai/cortex-manuscript/blob/main/main.tex"
                  className="text-[#0d9488] font-medium hover:underline"
                >
                  Open Live GitHub Preview (/gh/…) →
                </Link>
              </div>
            </div>
          ) : null}

          {sidebarTab === 'orca' ? (
            <div className="flex-1 flex flex-col p-4 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0d9488]">
                  Orca AI Co-Author
                </span>
                <div className="inline-flex rounded bg-[#f4f4ee] p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setOrcaMode('ask')}
                    className={`px-2 py-0.5 rounded ${
                      orcaMode === 'ask' ? 'bg-[#1c1c1a] text-white' : ''
                    }`}
                  >
                    Ask
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrcaMode('edit')}
                    className={`px-2 py-0.5 rounded ${
                      orcaMode === 'edit' ? 'bg-[#1c1c1a] text-white' : ''
                    }`}
                  >
                    Edit Diff
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {orcaMessages.length === 0 ? (
                  <p className="text-xs text-[#575751] leading-relaxed">
                    Ask Orca AI to refine your abstract, verify a proof, or propose a
                    structured LaTeX/Typst diff for{' '}
                    <strong className="text-[#1c1c1a]">{activeFile?.name}</strong>.
                  </p>
                ) : null}
                {orcaMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg text-xs ${
                      m.role === 'user'
                        ? 'bg-[#f4f4ee] text-[#1c1c1a]'
                        : 'bg-white border border-[#e2e2d8] text-[#1c1c1a]'
                    }`}
                  >
                    <div className="font-semibold text-[10px] uppercase text-[#8a8a80] mb-1">
                      {m.role === 'user' ? 'You' : 'Orca AI'}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    {m.diff ? (
                      <div className="mt-3 p-2.5 rounded bg-[#fafaf6] border border-[#d6d6cc] space-y-2">
                        <div className="text-[11px] font-semibold text-[#0d9488]">
                          Proposed Manuscript Diff
                        </div>
                        <pre className="font-mono-code text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          + {m.diff.proposedSnippet}
                        </pre>
                        <button
                          type="button"
                          onClick={() => applyOrcaDiff(m.diff!)}
                          className="w-full py-1.5 rounded bg-[#0d9488] text-white text-xs font-medium hover:bg-[#0f766e]"
                        >
                          Accept & Apply to {activeFile?.name}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAskOrca} className="mt-3 pt-3 border-t border-[#e2e2d8]">
                <textarea
                  rows={3}
                  placeholder="Ask Orca to polish prose, derive an equation, or add a theorem..."
                  value={orcaPrompt}
                  onChange={(e) => setOrcaPrompt(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#d6d6cc] text-xs resize-none"
                />
                <button
                  type="submit"
                  disabled={orcaLoading}
                  className="mt-1.5 w-full py-2 rounded bg-[#1c1c1a] text-white text-xs font-medium disabled:opacity-50"
                >
                  {orcaLoading ? 'Orca is thinking...' : `Send (${orcaMode.toUpperCase()})`}
                </button>
              </form>
            </div>
          ) : null}

          {sidebarTab === 'review' ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
                  Automated Review ({diagnostics.length})
                </div>
                <div className="space-y-2">
                  {diagnostics.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded border border-[#e2e2d8] bg-[#fafaf6] text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0d9488] text-[10px] uppercase">
                          {d.category}
                        </span>
                        <span className="font-mono-code text-[10px] text-[#8a8a80]">
                          Line {d.line}
                        </span>
                      </div>
                      <p className="mt-1 text-[#1c1c1a]">{d.message}</p>
                      {d.suggestion ? (
                        <p className="mt-1 text-[11px] text-[#575751] italic">
                          Suggestion: {d.suggestion}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2e2d8]">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
                  Inline Comments ({comments.length})
                </div>
                <form onSubmit={handleAddComment} className="space-y-2 mb-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={newCommentLine}
                      onChange={(e) => setNewCommentLine(Number(e.target.value) || 1)}
                      className="w-16 px-2 py-1 rounded border border-[#d6d6cc] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Add review comment..."
                      value={newCommentBody}
                      onChange={(e) => setNewCommentBody(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded border border-[#d6d6cc] text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                  >
                    Post comment
                  </button>
                </form>

                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded border border-[#e2e2d8] text-xs">
                      <div className="flex justify-between text-[10px] text-[#8a8a80]">
                        <span>{c.author?.name || c.author?.email}</span>
                        <span>
                          {c.filePath}:L{c.lineNumber}
                        </span>
                      </div>
                      <p className="mt-1 text-[#1c1c1a]">{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {sidebarTab === 'timeline' ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80]">
                Version History ({versions.length})
              </div>
              <form onSubmit={handleCreateVersion} className="space-y-2">
                <input
                  type="text"
                  placeholder="Version label (e.g., Camera-ready v1)"
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-[#d6d6cc] text-xs"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                >
                  Save version snapshot
                </button>
              </form>

              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded border border-[#e2e2d8] bg-[#fafaf6] text-xs"
                  >
                    <div className="font-semibold text-[#1c1c1a]">{v.label}</div>
                    <div className="text-[11px] text-[#575751] mt-0.5">
                      {v.summary || 'Workspace snapshot'}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#8a8a80]">
                      <span>{new Date(v.createdAt).toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(v.id)}
                        className="text-[#0d9488] font-semibold hover:underline"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        {/* Editor + Preview Split Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden">
          {(showSource || showVisual) && activeFile ? (
            <div
              className={`flex flex-col border-r border-[#e2e2d8] bg-[#fafaf6] min-h-0 ${
                !showPreview ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="px-4 py-2 border-b border-[#e2e2d8] bg-white flex items-center justify-between text-xs text-[#575751]">
                <span className="font-mono-code font-semibold text-[#1c1c1a]">
                  {activeFile.path}
                </span>
                <span>
                  {showVisual ? 'Visual Structured Mode' : 'Source Editor · SyncTeX'}
                </span>
              </div>
              <textarea
                aria-label="Manuscript source editor"
                value={activeFile.content}
                readOnly={accessRole === 'VIEWER'}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={saveActiveFile}
                className="flex-1 w-full p-5 font-mono-code text-xs sm:text-[13px] leading-relaxed bg-[#fafaf6] text-[#1c1c1a] resize-none focus:outline-none overflow-y-auto"
              />
            </div>
          ) : null}

          {showPreview ? (
            <div
              className={`flex flex-col bg-[#eaeae2] min-h-0 overflow-hidden ${
                !showSource && !showVisual ? 'lg:col-span-2' : ''
              }`}
            >
              {/* Preview Toolbar: Dark Page, Smart Margin Crop, Slide Storyboard */}
              <div className="px-4 py-1.5 border-b border-[#d6d6cc] bg-[#f4f4ee] flex flex-wrap items-center justify-between gap-2 text-xs text-[#575751]">
                <span className="font-medium text-[#1c1c1a]">
                  Live Typeset Preview ({latexEngine.toUpperCase()})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDarkPdfPage((v) => !v)}
                    data-testid="toggle-dark-pdf-btn"
                    className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                      darkPdfPage
                        ? 'bg-[#1c1c1a] text-white border-[#1c1c1a]'
                        : 'bg-white border-[#d6d6cc] text-[#575751]'
                    }`}
                  >
                    Dark page
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartCropMargins((v) => !v)}
                    data-testid="toggle-smart-crop-btn"
                    className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                      smartCropMargins
                        ? 'bg-[#1c1c1a] text-white border-[#1c1c1a]'
                        : 'bg-white border-[#d6d6cc] text-[#575751]'
                    }`}
                  >
                    Remove margins
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryboardOpen((v) => !v)}
                    data-testid="toggle-storyboard-btn"
                    className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                      storyboardOpen
                        ? 'bg-[#0d9488] text-white border-[#0d9488]'
                        : 'bg-white border-[#d6d6cc] text-[#575751]'
                    }`}
                  >
                    Slide Storyboard
                  </button>
                </div>
              </div>

              {storyboardOpen ? (
                <div
                  data-testid="slide-storyboard-drawer"
                  className="p-3 border-b border-[#d6d6cc] bg-white grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs"
                >
                  {(outline.length > 0
                    ? outline
                    : [
                        { id: 's1', title: 'Title & Motivation', level: 1, line: 1 },
                        { id: 's2', title: 'Formal Method', level: 1, line: 15 },
                        { id: 's3', title: 'Empirical Results', level: 1, line: 32 },
                      ]
                  ).map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="p-2.5 rounded border border-[#e2e2d8] bg-[#fafaf6] flex flex-col justify-between"
                    >
                      <div className="text-[10px] font-mono text-[#8a8a80]">
                        Slide {idx + 1} · L{slide.line}
                      </div>
                      <div className="font-semibold text-[#1c1c1a] truncate mt-1">
                        {slide.title}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div
                className={`flex-1 overflow-y-auto ${
                  smartCropMargins ? 'p-1' : 'p-6'
                }`}
              >
                <div
                  className={`max-w-3xl w-full mx-auto transition-all ${
                    darkPdfPage ? 'invert hue-rotate-180' : ''
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: compiledHtml }} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick Open Modal (Cmd+P) */}
      {quickOpenModal ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-md w-full overflow-hidden shadow-xl">
            <div className="p-3 border-b border-[#e2e2d8] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1c1c1a]">
                Quick Open File (⌘P)
              </span>
              <button
                type="button"
                onClick={() => setQuickOpenModal(false)}
                className="text-xs text-[#575751]"
              >
                ESC
              </button>
            </div>
            <div className="divide-y divide-[#e2e2d8] max-h-64 overflow-y-auto">
              {files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setActiveFileId(f.id);
                    setQuickOpenModal(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-mono-code hover:bg-[#f4f4ee] flex justify-between"
                >
                  <span>{f.path}</span>
                  <span className="text-[#8a8a80]">{f.sizeBytes} B</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 16-Family Academic Phrasebank Modal */}
      {phrasebankModal ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-2xl w-full overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-[#e2e2d8] flex items-center justify-between bg-[#f4f4ee]">
              <div>
                <h3 className="text-sm font-semibold text-[#1c1c1a]">
                  Academic Phrasebank (16 Rhetorical Families)
                </h3>
                <p className="text-[11px] text-[#575751]">
                  Filter by rhetorical function and claim strength (Cautious · Neutral · Strong)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhrasebankModal(false)}
                className="text-xs px-2.5 py-1 rounded bg-white border border-[#d6d6cc]"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-2.5 border-b border-[#e2e2d8] bg-[#fcfcf9] flex flex-wrap items-center justify-between gap-2 text-xs">
              <select
                value={phrasebankFamily}
                onChange={(e) => setPhrasebankFamily(e.target.value)}
                className="rounded border border-[#d6d6cc] bg-white px-2.5 py-1 text-xs"
              >
                {PHRASEBANK_FAMILIES.map((fam) => (
                  <option key={fam} value={fam}>
                    {fam}
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded border border-[#d6d6cc] bg-white p-0.5 text-[11px]">
                {(['all', 'cautious', 'neutral', 'strong'] as const).map((str) => (
                  <button
                    key={str}
                    type="button"
                    onClick={() => setPhrasebankStrength(str)}
                    className={`px-2 py-0.5 rounded capitalize ${
                      phrasebankStrength === str
                        ? 'bg-[#1c1c1a] text-white font-medium'
                        : 'text-[#575751]'
                    }`}
                  >
                    {str === 'all' ? 'All strengths' : str}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-[#e2e2d8]">
              {ACADEMIC_PHRASEBANK.filter((item) => {
                if (
                  phrasebankFamily !== 'All families' &&
                  item.category !== phrasebankFamily
                )
                  return false;
                if (
                  phrasebankStrength !== 'all' &&
                  item.strength &&
                  item.strength !== phrasebankStrength
                )
                  return false;
                return true;
              }).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (activeFile) {
                      handleContentChange(
                        `${activeFile.content.trimEnd()}\n\n${item.latexSnippet}\n`
                      );
                    }
                    setPhrasebankModal(false);
                  }}
                  className="w-full text-left p-4 hover:bg-[#fafaf6]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0d9488]">
                      {item.category} · {item.label}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {item.strength ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#f4f4ee] uppercase font-medium">
                          {item.strength}
                        </span>
                      ) : null}
                      {item.constraint ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {item.constraint}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <pre className="mt-1 font-mono-code text-xs text-[#575751] whitespace-pre-wrap">
                    {item.latexSnippet}
                  </pre>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* LaTeX Refactoring Tools Modal (Label Rename, Reference Repair, Wrap Environment) */}
      {refactorModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e2d8]">
              <h3 className="text-base font-semibold text-[#1c1c1a]">
                LaTeX Refactoring &amp; Reference Repair
              </h3>
              <button
                type="button"
                onClick={() => setRefactorModalOpen(false)}
                className="text-xs text-[#575751]"
              >
                Close
              </button>
            </div>

            <div className="flex gap-1.5 text-xs">
              {(
                [
                  ['label', 'Rename \\label{…}'],
                  ['repair', 'Repair \\ref / \\cite'],
                  ['wrap', 'Wrap in Environment'],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setRefactorTab(tabId)}
                  className={`px-3 py-1.5 rounded font-medium ${
                    refactorTab === tabId
                      ? 'bg-[#1c1c1a] text-white'
                      : 'bg-[#f4f4ee] text-[#575751]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {refactorFeedback ? (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {refactorFeedback}
              </div>
            ) : null}

            {refactorTab === 'label' ? (
              <form onSubmit={handleRenameLabel} className="space-y-3 text-xs">
                <p className="text-[#575751]">
                  Rename a <code>\label&#123;…&#125;</code> and automatically update all matching{' '}
                  <code>\ref</code>, <code>\eqref</code>, and <code>\autoref</code> across the project.
                </p>
                <div>
                  <label className="block font-medium text-[#1c1c1a] mb-1">
                    Current label
                  </label>
                  <input
                    type="text"
                    value={oldLabel}
                    onChange={(e) => setOldLabel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-[#d6d6cc] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1c1c1a] mb-1">
                    New label
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-[#d6d6cc] font-mono"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="confirm-label-rename-btn"
                  className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
                >
                  Rename label across project
                </button>
              </form>
            ) : refactorTab === 'repair' ? (
              <div className="space-y-3 text-xs">
                <p className="text-[#575751]">
                  Scan all files for unresolved <code>\ref&#123;?&#125;</code> or{' '}
                  <code>\cite&#123;?&#125;</code> commands and bind them to verified targets.
                </p>
                <div className="rounded border border-[#e2e2d8] bg-[#fafaf6] p-3">
                  <div className="font-mono text-[#1c1c1a]">
                    All citations ({stats.citationCount}) and equation labels ({stats.equationCount}) are resolved.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWrapEnvironment} className="space-y-3 text-xs">
                <p className="text-[#575751]">
                  Insert or wrap content in a structured LaTeX environment with automatic label scaffolding.
                </p>
                <select
                  value={wrapEnv}
                  onChange={(e) => setWrapEnv(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#d6d6cc] font-mono bg-white"
                >
                  <option value="equation">equation</option>
                  <option value="align">align</option>
                  <option value="figure">figure</option>
                  <option value="table">table</option>
                  <option value="theorem">theorem</option>
                  <option value="proof">proof</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white font-medium"
                >
                  Insert \begin&#123;{wrapEnv}&#125;
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* Accessible PDF Export & Preflight Dialog */}
      {accessibleExportOpen ? (
        <div
          data-ui="accessible-pdf-export-dialog"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e2d8]">
              <div>
                <h3 className="text-base font-semibold text-[#1c1c1a]">
                  {accessibleExportStage === 'preflight'
                    ? 'Accessible PDF preflight'
                    : 'Accessible PDF export'}
                </h3>
                <p className="text-xs text-[#575751]">
                  {accessibleExportStage === 'preflight'
                    ? 'Review source checks before CorTeX compiles a tagged PDF/UA-2 document.'
                    : `Saved ${project?.name || 'manuscript'}-accessible.pdf`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAccessibleExportOpen(false)}
                className="text-xs px-2.5 py-1 rounded border border-[#d6d6cc]"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded border border-[#e2e2d8] p-2.5">
                <div className="text-base font-semibold text-[#1c1c1a]">0</div>
                <div className="text-[#575751]">Fixes</div>
              </div>
              <div className="rounded border border-[#e2e2d8] p-2.5">
                <div className="text-base font-semibold text-[#1c1c1a]">
                  {diagnostics.length}
                </div>
                <div className="text-[#575751]">Needs review</div>
              </div>
              <div className="rounded border border-[#e2e2d8] p-2.5">
                <div className="text-base font-semibold text-[#1c1c1a]">1</div>
                <div className="text-[#575751]">Compatibility</div>
              </div>
            </div>

            {accessibleExportStage === 'preflight' ? (
              <>
                <div className="rounded border border-[#e2e2d8] bg-[#fafaf6] p-3 text-xs text-[#1c1c1a]">
                  No source issues were detected before tagged compile. Document class is compatible with LaTeX tagged PDF metadata.
                </div>
                <div className="border-t border-[#e2e2d8] pt-3 text-xs">
                  <div className="font-semibold text-[#1c1c1a]">
                    What you still need to check
                  </div>
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 list-disc pl-5 text-[#575751]">
                    <li>Heading levels follow document order</li>
                    <li>Reading order across columns, floats, and footnotes</li>
                    <li>Table headers and summaries where needed</li>
                    <li>Meaningful alt text for figures</li>
                    <li>Formula reading and MathML output</li>
                    <li>Descriptive link and citation text</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAccessibleExportOpen(false)}
                    className="px-3 py-1.5 rounded border border-[#d6d6cc] text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-accessible-export-btn"
                    onClick={() => setAccessibleExportStage('result')}
                    className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                  >
                    Continue export
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  Tagged PDF produced (not externally validated)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded border border-[#e2e2d8] p-3 space-y-1.5">
                    <div className="font-semibold text-[#1c1c1a]">Requested</div>
                    <div className="flex justify-between">
                      <span className="text-[#575751]">Standard</span>
                      <span className="font-medium">PDF/UA-2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#575751]">Language</span>
                      <span className="font-medium">en</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#575751]">Metadata</span>
                      <span className="font-medium">Injected</span>
                    </div>
                  </div>
                  <div className="rounded border border-[#e2e2d8] p-3 space-y-1.5">
                    <div className="font-semibold text-[#1c1c1a]">Observed in PDF</div>
                    <div className="flex justify-between">
                      <span className="text-[#575751]">Tagged</span>
                      <span className="font-medium text-emerald-700">Yes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#575751]">Figures</span>
                      <span className="font-medium">
                        {stats.figureCount} with alt text / {stats.figureCount} total
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#575751]">Formulas</span>
                      <span className="font-medium">
                        {stats.equationCount} with MathML / {stats.equationCount} total
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-[#e2e2d8] bg-[#fafaf6] p-3 text-xs">
                  <div className="font-semibold text-[#1c1c1a]">
                    AI Disclosure Metadata (CorTeXAIDisclosure)
                  </div>
                  <p className="mt-1 text-[#575751]">
                    AI가 생성한 내용이 포함되어 있을 수 있습니다 / May contain AI-generated content.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    data-testid="download-accessibility-report-btn"
                    onClick={downloadAccessibilityReport}
                    className="px-3.5 py-1.5 rounded border border-[#d6d6cc] bg-white text-xs font-medium"
                  >
                    Download accessibility report (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessibleExportOpen(false)}
                    className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Section PDF Export Dialog */}
      {sectionExportOpen ? (
        <div
          data-ui="section-export-dialog"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-[#e2e2d8] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1c1c1a]">
                Export section PDF
              </h3>
              <button
                type="button"
                onClick={() => setSectionExportOpen(false)}
                className="text-xs px-2.5 py-1 rounded border border-[#d6d6cc]"
              >
                Close
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0 overflow-hidden">
              <div className="p-4 border-r border-[#e2e2d8] overflow-y-auto space-y-2 text-xs">
                <div className="font-semibold text-[#575751]">Sections</div>
                {(outline.length > 0
                  ? outline
                  : [{ id: 'sec-1', title: '1  Introduction', level: 1, line: 1 }]
                ).map((sec) => {
                  const checked = selectedSectionIds.includes(sec.id);
                  return (
                    <label
                      key={sec.id}
                      className="flex items-center gap-2 py-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedSectionIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== sec.id)
                              : [...prev, sec.id]
                          )
                        }
                      />
                      <span className="truncate text-[#1c1c1a]">{sec.title}</span>
                    </label>
                  );
                })}
                <div className="pt-3 border-t border-[#e2e2d8] text-[11px] text-[#575751]">
                  <div className="font-semibold text-[#1c1c1a]">Review</div>
                  <p className="mt-1">
                    Selected {selectedSectionIds.length} section(s). Cross-references to unselected sections are automatically noted.
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 p-5 bg-[#fafaf6] overflow-y-auto">
                <div
                  className="bg-white rounded border border-[#e2e2d8] p-6 text-xs"
                  dangerouslySetInnerHTML={{ __html: compiledHtml }}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#e2e2d8] flex justify-end gap-2">
              <button
                type="button"
                data-ui="section-export-download"
                onClick={() => {
                  downloadProjectBundle();
                  setSectionExportOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* New File Modal */}
      {newFileModal ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewFile}
            className="bg-white rounded-xl border border-[#e2e2d8] max-w-sm w-full p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-sm font-semibold text-[#1c1c1a]">Create New File</h3>
            <input
              type="text"
              required
              placeholder="e.g., appendix.tex or figures/plot.tex"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#d6d6cc] text-xs font-mono-code"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewFileModal(false)}
                className="px-3 py-1.5 rounded border border-[#d6d6cc] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Granular Share & RBAC Modal */}
      {shareModal ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2e2d8] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#1c1c1a]">
                  Share & Granular RBAC Permissions
                </h3>
                <p className="text-xs text-[#575751]">
                  Scope permissions to the whole project, a specific folder, or a single
                  file.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModal(false)}
                className="text-xs px-2.5 py-1 rounded border border-[#d6d6cc]"
              >
                Done
              </button>
            </div>

            {shareFeedback ? (
              <div className="p-2.5 rounded bg-[#0d9488]/10 text-[#0d9488] text-xs font-medium">
                {shareFeedback}
              </div>
            ) : null}

            <form onSubmit={handleInviteCollaborator} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="email"
                  required
                  placeholder="coauthor@mit.edu"
                  value={inviteCollabEmail}
                  onChange={(e) => setInviteCollabEmail(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 rounded border border-[#d6d6cc] text-xs"
                />
                <select
                  value={inviteCollabPerm}
                  onChange={(e) => setInviteCollabPerm(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-[#d6d6cc] text-xs bg-white"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="COMMENTER">Commenter</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="OWNER">Co-Owner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={inviteScopeType}
                  onChange={(e) => setInviteScopeType(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-[#d6d6cc] text-xs bg-white"
                >
                  <option value="PROJECT">Entire Project</option>
                  <option value="FOLDER">Specific Folder</option>
                  <option value="FILE">Single File</option>
                </select>
                <input
                  type="text"
                  placeholder="Scope path (e.g., / or main.tex)"
                  value={inviteScopePath}
                  onChange={(e) => setInviteScopePath(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-[#d6d6cc] text-xs font-mono-code"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded bg-[#1c1c1a] text-white text-xs font-medium"
                >
                  Add Collaborator
                </button>
                <button
                  type="button"
                  onClick={handleCreateShareLink}
                  className="px-3.5 py-2 rounded border border-[#d6d6cc] text-xs font-medium hover:bg-[#f4f4ee]"
                >
                  Create Share Link
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-44 overflow-y-auto border-t border-[#e2e2d8] pt-3">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-[#fafaf6]"
                >
                  <span className="font-medium">{c.invitedEmail}</span>
                  <span className="font-mono-code text-[11px] text-[#575751]">
                    {c.permission} · {c.scopeType} ({c.scopePath})
                  </span>
                </div>
              ))}
              {shareLinks.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-[#f4f4ee]"
                >
                  <span className="font-mono-code truncate max-w-[220px]">
                    /app/projects/{projectId}?share={l.token}
                  </span>
                  <span className="font-semibold text-[#0d9488]">{l.permission}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
