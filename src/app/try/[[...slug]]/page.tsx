'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CortexLogo } from '@/components/CortexLogo';
import { compileAcademicDocument } from '@/lib/compiler/compile-engine';
import { ACADEMIC_PHRASEBANK } from '@/lib/data/phrasebank';

type TryFormat = 'tex' | 'typ' | 'md' | 'slides';

const TRY_STARTERS: Record<
  TryFormat,
  {
    label: string;
    fileName: string;
    format: 'latex' | 'typst' | 'markdown' | 'slides';
    files: Array<{ name: string; content: string }>;
  }
> = {
  tex: {
    label: 'LaTeX (.tex)',
    fileName: 'main.tex',
    format: 'latex',
    files: [
      {
        name: 'main.tex',
        content: `\\documentclass[11pt]{article}
\\usepackage{amsmath,amssymb,graphicx,hyperref}

\\title{Spectral Convergence of Geodesic Attention Networks}
\\author{CorTeX Interactive Browser Trial}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Welcome to the instant CorTeX browser workspace. Edit this LaTeX manuscript on the left to see real-time academic typesetting, SyncTeX outline extraction, and citation diagnostics on the right.
\\end{abstract}

\\section{Introduction}
Modern scientific writing requires seamless integration between formal derivation and literature synthesis \\cite{vaswani2017attention,dao2022flashattention}.

\\subsection{Problem Formulation}
Let $(\\mathcal{M}, g)$ be a compact Riemannian manifold. The heat kernel operator satisfies:
\\begin{equation}
  \\frac{\\partial u}{\\partial t} = \\Delta_g u, \\qquad u(x, 0) = f(x).
\\end{equation}

\\section{Experimental Highlights}
\\begin{itemize}
  \\item Type \\textbf{/} or click \\textbf{Phrasebank} in the toolbar to insert academic transitions.
  \\item Switch between \\textbf{Visual}, \\textbf{Source}, and \\textbf{Preview} panes at any time.
  \\item Click any paragraph in the preview sheet to jump to its source line.
\\end{itemize}

\\bibliographystyle{plain}
\\bibliography{refs}
\\end{document}`,
      },
      {
        name: 'refs.bib',
        content: `@inproceedings{vaswani2017attention,
  title={Attention Is All You Need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob},
  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},
  year={2017}
}

@inproceedings{dao2022flashattention,
  title={FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness},
  author={Dao, Tri and Fu, Daniel Y. and Ermon, Stefano and Rudra, Atri and R{\\'e}, Christopher},
  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},
  year={2022}
}`,
      },
    ],
  },
  typ: {
    label: 'Typst (.typ)',
    fileName: 'main.typ',
    format: 'typst',
    files: [
      {
        name: 'main.typ',
        content: `#set page(paper: "us-letter", margin: 2.2cm)
#set text(font: "New Computer Modern", size: 11pt)

= Compositional Type Systems for Differentiable Programming

*Abstract.* Welcome to the Typst browser workspace in CorTeX. Typst provides concise markup with sub-millisecond incremental layout.

== Operational Semantics
For every well-typed term $Gamma |- e : tau$, the reverse-mode derivative operator preserves linear resource invariants:
$ nabla_x cal(L)(x) = J_f (x)^top dot w $

== Key Benefits
- Clean heading syntax with \`=\` and \`==\`
- Native math blocks surrounded by \`$ ... $\`
- Instant bibliography cross-referencing via @vaswani2017attention`,
      },
      {
        name: 'refs.bib',
        content: `@inproceedings{vaswani2017attention,
  title={Attention Is All You Need},
  author={Vaswani, Ashish and Shazeer, Noam},
  year={2017}
}`,
      },
    ],
  },
  md: {
    label: 'Markdown (.md)',
    fileName: 'notes.md',
    format: 'markdown',
    files: [
      {
        name: 'notes.md',
        content: `# Literature Review: Retrieval-Augmented Scientific Discovery

## 1. Research Question
How can structured citation graphs improve multi-hop theorem verification in scholarly language models?

$$\\mathcal{F}(q, \\mathcal{G}) = \\sum_{v \\in \\mathcal{N}_k(q)} \\alpha_v \\cdot \\phi(v)$$

## 2. Key Takeaways
- Grounding every paragraph in primary BibTeX sources eliminates hallucinated DOIs.
- Use the CorTeX Research Library to highlight PDFs and export directly to LaTeX or Typst.`,
      },
    ],
  },
  slides: {
    label: 'Presentation (Slides)',
    fileName: 'slides.md',
    format: 'slides',
    files: [
      {
        name: 'slides.md',
        content: `# Slide 1: CorTeX Academic Presentation Mode
- Write clean Markdown separated by \`---\` horizontal rules
- Automatic 16:9 slide deck formatting with display equations

---

# Slide 2: Spectral Graph Convolution
$$H^{(l+1)} = \\sigma\\left(\\tilde{D}^{-1/2}\\tilde{A}\\tilde{D}^{-1/2}H^{(l)}W^{(l)}\\right)$$
- Preserves localized spectral filters on arbitrary graphs
- Zero external Beamer boilerplate required

---

# Slide 3: Conclusion & Next Steps
- Export directly to PDF or fork into a collaborative CorTeX project`,
      },
    ],
  },
};

const TOUR_STEPS = [
  {
    title: '1. Multi-Format Academic Editor',
    body: 'Switch seamlessly between LaTeX (.tex), Typst (.typ), Scholarly Markdown (.md), and 16:9 Presentation Decks using the top format switcher.',
  },
  {
    title: '2. Visual, Source & SyncTeX Preview',
    body: 'Toggle Visual outline mode, Source code, and live typeset Preview. Clicking any paragraph in the preview highlights its corresponding source line.',
  },
  {
    title: '3. Slash (/) Academic Phrasebank',
    body: 'Click "Phrasebank (/)" in the toolbar to insert peer-reviewed academic transitions for Introductions, Related Work, Methodology, and Proofs.',
  },
  {
    title: '4. Automated Review & Citation Lint',
    body: 'CorTeX automatically verifies every \\cite{key} against your refs.bib file and flags unresolved citations or unreferenced equations.',
  },
  {
    title: '5. Save or Export Anytime',
    body: 'Download your source files immediately or sign in with an invitation pass to save your manuscript to a persistent collaborative workspace.',
  },
];

function TryWorkspaceInner() {
  const params = useParams<{ slug?: string[] }>();
  const searchParams = useSearchParams();
  const slug0 = (Array.isArray(params?.slug) ? params.slug[0] : '') as TryFormat;
  const initialFormat: TryFormat = ['tex', 'typ', 'md', 'slides'].includes(slug0)
    ? slug0
    : 'tex';

  const [formatKey, setFormatKey] = useState<TryFormat>(initialFormat);
  const [files, setFiles] = useState(TRY_STARTERS[initialFormat].files);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [showSource, setShowSource] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [phrasebankOpen, setPhrasebankOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(searchParams.get('tour') === '1');
  const [tourStep, setTourStep] = useState(0);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  useEffect(() => {
    if (['tex', 'typ', 'md', 'slides'].includes(slug0)) {
      setFormatKey(slug0);
      setFiles(TRY_STARTERS[slug0].files);
      setActiveFileIdx(0);
    }
  }, [slug0]);

  const tourQuery = searchParams.get('tour');
  useEffect(() => {
    if (tourQuery === '1') {
      setTourOpen(true);
    }
  }, [tourQuery]);
  const starterMeta = TRY_STARTERS[formatKey];
  const currentFile = files[activeFileIdx] || files[0];
  const bibFile = files.find((f) => f.name.endsWith('.bib'));

  const compiled = useMemo(() => {
    return compileAcademicDocument({
      format: starterMeta.format,
      fileName: currentFile.name,
      content: currentFile.content,
      bibContent: bibFile?.content,
    });
  }, [starterMeta.format, currentFile, bibFile]);

  function handleSwitchFormat(next: TryFormat) {
    setFormatKey(next);
    setFiles(TRY_STARTERS[next].files);
    setActiveFileIdx(0);
  }

  function updateContent(nextContent: string) {
    setFiles((prev) =>
      prev.map((f, idx) => (idx === activeFileIdx ? { ...f, content: nextContent } : f))
    );
  }

  function insertSnippet(snippet: string) {
    updateContent(`${currentFile.content.trimEnd()}\n\n${snippet}\n`);
    setPhrasebankOpen(false);
  }

  function downloadFile() {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-screen flex flex-col bg-[#fcfcf9] text-[#1c1c1a] overflow-hidden">
      {/* Top Trial Header */}
      <header className="h-13 border-b border-[#e2e2d8] bg-white px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <CortexLogo size="sm" subtitle="Browser Trial" />
          <div className="flex items-center gap-1 bg-[#f4f4ee] p-1 rounded-md border border-[#e2e2d8]">
            {(['tex', 'typ', 'md', 'slides'] as TryFormat[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleSwitchFormat(k)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  formatKey === k
                    ? 'bg-[#1c1c1a] text-white'
                    : 'text-[#575751] hover:text-[#1c1c1a]'
                }`}
              >
                {TRY_STARTERS[k].label}
              </button>
            ))}
          </div>
        </div>

        {/* Center Pane Toggles */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-[#d6d6cc] bg-[#f4f4ee] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowSource(true);
                setShowPreview(false);
              }}
              className={`px-2.5 py-1 rounded ${
                showSource && !showPreview ? 'bg-white font-semibold shadow-sm' : ''
              }`}
            >
              &lt;/&gt; Source
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSource(true);
                setShowPreview(true);
              }}
              className={`px-2.5 py-1 rounded ${
                showSource && showPreview ? 'bg-white font-semibold shadow-sm' : ''
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSource(false);
                setShowPreview(true);
              }}
              className={`px-2.5 py-1 rounded ${
                !showSource && showPreview ? 'bg-white font-semibold shadow-sm' : ''
              }`}
            >
              Preview
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPhrasebankOpen(true)}
            className="px-2.5 py-1.5 rounded-md border border-[#d6d6cc] bg-white text-xs font-medium text-[#1c1c1a] hover:bg-[#f4f4ee]"
          >
            Phrasebank (/)
          </button>

          <button
            type="button"
            onClick={() => {
              setTourStep(0);
              setTourOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-md border border-[#0d9488]/40 bg-[#0d9488]/10 text-xs font-medium text-[#0d9488]"
          >
            5-Step Tour
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadFile}
            className="px-3 py-1.5 rounded-md border border-[#d6d6cc] bg-white text-xs font-medium hover:bg-[#f4f4ee]"
          >
            Download {currentFile.name}
          </button>
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-md bg-[#1c1c1a] text-white text-xs font-medium hover:bg-[#33332f]"
          >
            Sign in to save
          </Link>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left File & Outline Rail */}
        <aside className="w-56 border-r border-[#e2e2d8] bg-[#f4f4ee] flex flex-col justify-between p-3 hidden md:flex">
          <div className="space-y-5 overflow-y-auto">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
                Trial Files
              </div>
              <ul className="space-y-1">
                {files.map((f, idx) => (
                  <li key={f.name}>
                    <button
                      type="button"
                      onClick={() => setActiveFileIdx(idx)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono-code flex items-center justify-between ${
                        idx === activeFileIdx
                          ? 'bg-[#1c1c1a] text-white font-medium'
                          : 'text-[#575751] hover:bg-[#eaeae2]'
                      }`}
                    >
                      <span>{f.name}</span>
                      {idx === 0 ? (
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#0d9488] text-white rounded">
                          main
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
                Document Outline
              </div>
              {compiled.outline.length === 0 ? (
                <p className="text-xs text-[#8a8a80]">No sections detected</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {compiled.outline.map((item) => (
                    <li key={`${item.line}-${item.title}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedLine(item.line)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-[#eaeae2] text-[#575751] hover:text-[#1c1c1a] truncate"
                        style={{ paddingLeft: `${(item.level - 1) * 10 + 8}px` }}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">
                Review Diagnostics ({compiled.diagnostics.length})
              </div>
              <ul className="space-y-1.5 text-xs">
                {compiled.diagnostics.map((d, i) => (
                  <li
                    key={i}
                    className="p-2 rounded bg-white border border-[#e2e2d8] text-[#575751]"
                  >
                    <span className="font-semibold text-[#0d9488] uppercase text-[10px]">
                      {d.category} · L{d.line}
                    </span>
                    <p className="mt-0.5 text-[11px] text-[#1c1c1a]">{d.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e2e2d8] text-[11px] text-[#575751]">
            <div>Words: {compiled.stats.wordCount}</div>
            <div>Equations: {compiled.stats.equationCount}</div>
            <div>Citations: {compiled.stats.citationCount}</div>
          </div>
        </aside>

        {/* Split Editor & Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden">
          {showSource ? (
            <div
              className={`flex flex-col border-r border-[#e2e2d8] bg-[#fafaf6] min-h-0 ${
                !showPreview ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="px-4 py-2 border-b border-[#e2e2d8] bg-white flex items-center justify-between text-xs text-[#575751]">
                <span className="font-mono-code font-medium text-[#1c1c1a]">
                  {currentFile.name}
                </span>
                <span>
                  {selectedLine ? `Synced to line ${selectedLine}` : 'Type / for Phrasebank'}
                </span>
              </div>
              <textarea
                aria-label="Source code editor"
                value={currentFile.content}
                onChange={(e) => updateContent(e.target.value)}
                className="flex-1 w-full p-5 font-mono-code text-xs sm:text-[13px] leading-relaxed bg-[#fafaf6] text-[#1c1c1a] resize-none focus:outline-none overflow-y-auto"
              />
            </div>
          ) : null}

          {showPreview ? (
            <div
              className={`flex flex-col bg-[#eaeae2] min-h-0 overflow-y-auto p-6 ${
                !showSource ? 'lg:col-span-2' : ''
              }`}
              onClick={(e) => {
                const target = (e.target as HTMLElement).closest('[data-line]');
                if (target) {
                  const line = Number(target.getAttribute('data-line'));
                  if (line) setSelectedLine(line);
                }
              }}
            >
              <div className="max-w-3xl w-full mx-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: compiled.html }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Phrasebank Modal */}
      {phrasebankOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e2d8] max-w-xl w-full overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-[#e2e2d8] flex items-center justify-between bg-[#f4f4ee]">
              <h3 className="text-sm font-semibold text-[#1c1c1a]">
                Academic Phrasebank & LaTeX Snippets (/)
              </h3>
              <button
                type="button"
                onClick={() => setPhrasebankOpen(false)}
                className="text-xs px-2.5 py-1 rounded bg-white border border-[#d6d6cc]"
              >
                Close
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[#e2e2d8]">
              {ACADEMIC_PHRASEBANK.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => insertSnippet(item.latexSnippet)}
                  className="w-full text-left p-4 hover:bg-[#fafaf6] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0d9488]">
                      {item.category}
                    </span>
                    <span className="text-xs font-medium text-[#1c1c1a]">
                      {item.label}
                    </span>
                  </div>
                  <pre className="mt-1.5 font-mono-code text-xs text-[#575751] whitespace-pre-wrap">
                    {item.latexSnippet}
                  </pre>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 5-Step Guided Tour Modal */}
      {tourOpen ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full rounded-xl border border-[#1c1c1a] bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-[#0d9488] font-semibold uppercase">
            <span>
              Interactive Tour · Step {tourStep + 1} of {TOUR_STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => setTourOpen(false)}
              className="text-[#8a8a80] hover:text-[#1c1c1a]"
            >
              ✕
            </button>
          </div>
          <h4 className="text-sm font-semibold text-[#1c1c1a] mt-2">
            {TOUR_STEPS[tourStep].title}
          </h4>
          <p className="text-xs text-[#575751] mt-1.5 leading-relaxed">
            {TOUR_STEPS[tourStep].body}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={tourStep === 0}
              onClick={() => setTourStep((s) => Math.max(0, s - 1))}
              className="text-xs text-[#575751] disabled:opacity-40"
            >
              ← Previous
            </button>
            {tourStep < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setTourStep((s) => s + 1)}
                className="px-3 py-1.5 rounded bg-[#1c1c1a] text-white text-xs font-medium"
              >
                Next step →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTourOpen(false)}
                className="px-3 py-1.5 rounded bg-[#0d9488] text-white text-xs font-medium"
              >
                Finish tour
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm">Loading trial workspace...</div>}>
      <TryWorkspaceInner />
    </Suspense>
  );
}
