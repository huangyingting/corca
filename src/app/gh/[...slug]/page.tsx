'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  GitBranch,
  FolderGit2,
  Play,
  Download,
  Save,
  ArrowLeft,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';

export default function GitHubDirectWorkspacePage() {
  const params = useParams<{ slug?: string[] }>();
  const router = useRouter();
  const slugParts = Array.isArray(params?.slug) ? params.slug : [];

  const owner = slugParts[0] || 'corca-ai';
  const repo = slugParts[1] || 'cortex-paper-template';
  const ref = slugParts[2] === 'blob' && slugParts[3] ? slugParts[3] : 'main';
  const filePath =
    slugParts[2] === 'blob' && slugParts.length > 4
      ? slugParts.slice(4).join('/')
      : 'main.tex';

  const [source, setSource] = useState<string>(
    `\\documentclass{article}
\\usepackage{amsmath,amssymb}
\\title{${repo.replace(/[-_]/g, ' ')}: Live GitHub Workspace}
\\author{${owner} (${ref})}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Opened directly via CorTeX GitHub workspace address \\texttt{${owner}/${repo}@${ref}:${filePath}}.
\\end{abstract}

\\section{Introduction}
You can inspect, compile, and edit this repository file directly in your browser or import it into your CorTeX projects.

\\begin{equation}
  \\mathcal{L}_{\\text{GitHub}}(\\theta) = \\sum_{i=1}^{N} \\|\\hat{y}_i - y_i\\|_2^2
\\end{equation}

\\section{Repository Metadata}
\\begin{itemize}
  \\item Owner: \\textbf{${owner}}
  \\item Repository: \\textbf{${repo}}
  \\item Branch / Ref: \\texttt{${ref}}
  \\item Entry Path: \\texttt{${filePath}}
\\end{itemize}

\\end{document}`
  );

  const [compiledHtml, setCompiledHtml] = useState<string>('');
  const [compiling, setCompiling] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    void handleCompile(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCompile(content = source) {
    setCompiling(true);
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: filePath.endsWith('.typ')
            ? 'typst'
            : filePath.endsWith('.md')
            ? 'markdown'
            : 'latex',
          source: content,
          fileName: filePath,
        }),
      });
      const data = await res.json();
      if (data.htmlPreview) {
        setCompiledHtml(data.htmlPreview);
      }
    } finally {
      setCompiling(false);
    }
  }

  async function handleSaveAsProject() {
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${owner}/${repo}`,
          description: `Imported from GitHub ${owner}/${repo}@${ref} (${filePath})`,
          templateId: 'blank-latex-article',
          initialSource: source,
          githubRepo: `${owner}/${repo}`,
          githubBranch: ref,
        }),
      });
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/gh/${slugParts.join('/')}`)}`);
        return;
      }
      const data = await res.json();
      if (res.ok && data.project?.id) {
        router.push(`/app/projects/${data.project.id}`);
      } else {
        setImportError(data.error || 'Could not import GitHub repository.');
      }
    } catch {
      setImportError('Could not import GitHub repository.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#f8f9fb] text-[#14181f]">
      <header className="flex items-center justify-between border-b border-[#dde2ea] bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] px-2.5 py-1 text-xs font-medium text-[#525a65] hover:bg-[#f1f4f8] hover:text-[#14181f]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Projects
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FolderGit2 className="h-4 w-4 text-[#1e3a6e]" />
            <span data-testid="gh-address-title">
              {owner}/{repo}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#edf3fc] px-2 py-0.5 font-mono text-xs text-[#1e3a6e]">
              <GitBranch className="h-3 w-3" />
              {ref}
            </span>
            <span className="font-mono text-xs text-[#525a65]">/{filePath}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCompile(source)}
            disabled={compiling}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] bg-white px-3 py-1.5 text-xs font-medium text-[#14181f] hover:bg-[#f1f4f8]"
          >
            <Play className="h-3.5 w-3.5 text-[#2b7032]" />
            {compiling ? 'Compiling…' : 'Compile'}
          </button>
          <button
            type="button"
            onClick={handleSaveAsProject}
            disabled={importing}
            data-testid="gh-import-project-btn"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1e3a6e] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#162d57] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {importing ? 'Importing…' : 'Save as CorTeX project'}
          </button>
        </div>
      </header>

      {importError && (
        <div className="border-b border-[#b33232]/20 bg-[#fdecec] px-4 py-2 text-xs text-[#b33232]">
          {importError}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col border-r border-[#dde2ea] bg-white">
          <div className="flex items-center justify-between border-b border-[#dde2ea] bg-[#f8f9fb] px-3 py-1.5 text-xs text-[#525a65]">
            <span className="inline-flex items-center gap-1.5 font-mono font-medium text-[#14181f]">
              <FileCode2 className="h-3.5 w-3.5 text-[#3564b3]" />
              {filePath}
            </span>
            <span className="inline-flex items-center gap-1 text-[#2b7032]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              GitHub Live Buffer
            </span>
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            aria-label="GitHub file source editor"
            className="min-h-0 flex-1 resize-none p-4 font-mono text-xs leading-6 text-[#14181f] focus:outline-none"
          />
        </div>

        <div className="flex flex-col bg-[#f1f4f8]">
          <div className="flex items-center justify-between border-b border-[#dde2ea] bg-[#f8f9fb] px-3 py-1.5 text-xs text-[#525a65]">
            <span>Typeset Preview ({filePath})</span>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([source], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filePath.split('/').pop() || 'main.tex';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1e3a6e] hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download source
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <div
              data-testid="gh-preview-sheet"
              className="mx-auto max-w-2xl rounded-md border border-[#dde2ea] bg-white p-8 shadow-xs"
              dangerouslySetInnerHTML={{
                __html:
                  compiledHtml ||
                  '<p class="text-sm text-[#525a65]">Compiling repository preview…</p>',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
