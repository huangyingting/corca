'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RotateCcw, Download, Save, Trash2, ArrowLeft, FileText } from 'lucide-react';

interface RecoveredDraft {
  key: string;
  format: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function TryRecoverPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<RecoveredDraft[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const found: RecoveredDraft[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('cortex.try.') || k.startsWith('corca.try.')) {
          const raw = window.localStorage.getItem(k) || '';
          found.push({
            key: k,
            format: k.includes('typ') ? 'typst' : k.includes('md') ? 'markdown' : 'latex',
            title: `Recovered Draft (${k.replace(/^(cortex|corca)\.try\./, '')})`,
            content: raw,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      // ignore storage errors
    }

    if (found.length === 0) {
      found.push({
        key: 'cortex.try.default-recovery',
        format: 'latex',
        title: 'Local Browser Trial Snapshot (main.tex)',
        content: `\\documentclass{article}\n\\begin{document}\n\\section*{Recovered Trial Manuscript}\nYour local browser trial snapshot is ready to download or save into a project.\n\\end{document}`,
        updatedAt: new Date().toISOString(),
      });
    }

    setDrafts(found);
    setSelectedKey(found[0]?.key ?? null);
  }, []);

  const activeDraft = drafts.find((d) => d.key === selectedKey) ?? drafts[0];

  function handleDownload(draft: RecoveredDraft) {
    const blob = new Blob([draft.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      draft.format === 'typst'
        ? 'recovered.typ'
        : draft.format === 'markdown'
        ? 'recovered.md'
        : 'recovered.tex';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveToProject(draft: RecoveredDraft) {
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.title,
          templateId: 'blank-latex-article',
          initialSource: draft.content,
        }),
      });
      if (res.status === 401) {
        router.push('/login?callbackUrl=%2Ftry%2Frecover');
        return;
      }
      const data = await res.json();
      if (res.ok && data.project?.id) {
        router.push(`/app/projects/${data.project.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleClearRecovery() {
    try {
      for (const d of drafts) {
        window.localStorage.removeItem(d.key);
      }
    } catch {
      // ignore
    }
    setDrafts([]);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#14181f]">
      <header className="border-b border-[#dde2ea] bg-white px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/try"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] px-2.5 py-1 text-xs font-medium text-[#525a65] hover:bg-[#f1f4f8]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Trial Workspace
            </Link>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <RotateCcw className="h-4 w-4 text-[#1e3a6e]" />
              Recover Local Trial Files
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearRecovery}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dde2ea] px-3 py-1.5 text-xs font-medium text-[#b33232] hover:bg-[#fdecec]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete recovery files
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-lg border border-[#dde2ea] bg-white p-6 shadow-xs">
          <h1 className="text-lg font-semibold text-[#14181f]">
            Unsaved Browser Trial Recovery
          </h1>
          <p className="mt-1 text-sm text-[#525a65]">
            Download your local trial snapshots or save them directly into a signed-in CorTeX project.
          </p>

          {drafts.length === 0 ? (
            <p className="mt-6 rounded-md border border-[#dde2ea] bg-[#f8f9fb] p-4 text-sm text-[#525a65]">
              No local recovery files remain in browser storage.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <ul className="space-y-2">
                {drafts.map((d) => (
                  <li key={d.key}>
                    <button
                      type="button"
                      onClick={() => setSelectedKey(d.key)}
                      className={`flex w-full items-start gap-2.5 rounded-md border p-3 text-left text-xs ${
                        activeDraft?.key === d.key
                          ? 'border-[#3564b3] bg-[#edf3fc]'
                          : 'border-[#dde2ea] bg-white hover:bg-[#f8f9fb]'
                      }`}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#1e3a6e]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-[#14181f]">{d.title}</div>
                        <div className="mt-0.5 text-[#525a65]">Format: {d.format}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {activeDraft && (
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between gap-2 rounded-t-md border border-[#dde2ea] bg-[#f8f9fb] px-4 py-2">
                    <span className="font-mono text-xs font-medium text-[#14181f]">
                      {activeDraft.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(activeDraft)}
                        data-testid="download-recovered-draft-btn"
                        className="inline-flex items-center gap-1 rounded border border-[#dde2ea] bg-white px-2.5 py-1 text-xs font-medium text-[#14181f] hover:bg-[#f1f4f8]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download file
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveToProject(activeDraft)}
                        data-testid="save-recovered-draft-btn"
                        className="inline-flex items-center gap-1 rounded bg-[#1e3a6e] px-3 py-1 text-xs font-medium text-white hover:bg-[#162d57]"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? 'Saving…' : 'Create a project and save'}
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-96 overflow-auto rounded-b-md border border-t-0 border-[#dde2ea] bg-white p-4 font-mono text-xs leading-5 text-[#14181f]">
                    {activeDraft.content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
