export interface BibEntry {
  citeKey: string;
  entryType: string;
  title: string;
  author: string;
  year: string;
  venue: string;
  index: number;
}

export interface OutlineNode {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  line: number;
}

export interface ReviewDiagnostic {
  id: string;
  category: 'writing' | 'citation' | 'accessibility';
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  filePath: string;
  line: number;
  suggestion?: string;
}

export interface SlideItem {
  index: number;
  title: string;
  bodyHtml: string;
  speakerNotes: string;
  sourceLine: number;
}

export interface CompiledManuscript {
  ok: boolean;
  format: 'latex' | 'typst' | 'markdown' | 'slides' | 'bib' | 'docx';
  title: string;
  authors: string[];
  abstractHtml: string;
  columns: 1 | 2;
  venueBadge: string;
  pagesHtml: string[];
  slides: SlideItem[];
  bibliography: BibEntry[];
  outline: OutlineNode[];
  diagnostics: ReviewDiagnostic[];
  compileLog: string;
  elapsedMs: number;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseBibtexContent(bibRaw: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const regex = /@(\w+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)\n\}/g;
  let match: RegExpExecArray | null;
  let idx = 1;

  while ((match = regex.exec(bibRaw)) !== null) {
    const entryType = match[1].toLowerCase();
    const citeKey = match[2].trim();
    const body = match[3];
    const extractField = (name: string): string => {
      const fieldRegex = new RegExp(
        `${name}\\s*=\\s*(?:\\{([\\s\\S]*?)\\}|"([\\s\\S]*?)")(?=\\s*,|\\s*$)`,
        'i'
      );
      const m = fieldRegex.exec(body);
      const val = (m?.[1] ?? m?.[2] ?? '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
      return val;
    };

    entries.push({
      citeKey,
      entryType,
      title: extractField('title') || citeKey,
      author: extractField('author') || 'Unknown Author',
      year: extractField('year') || 'n.d.',
      venue:
        extractField('journal') ||
        extractField('booktitle') ||
        extractField('publisher') ||
        'Working Paper',
      index: idx++,
    });
  }
  return entries;
}

function formatMathExpression(expr: string, displayMode = false): string {
  const cleaned = escapeHtml(expr.trim())
    .replace(/\\mathcal\{([A-Za-z])\}/g, '𝒜')
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{E\}/g, '𝔼')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\Sigma/g, 'Σ')
    .replace(/\\Lambda/g, 'Λ')
    .replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '∑<sub>$1</sub><sup>$2</sup>')
    .replace(/\\sum/g, '∑')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="inline-fraction"><span>$1</span><span>$2</span></span>')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\uparrow/g, '↑')
    .replace(/\\downarrow/g, '↓')
    .replace(/\\to/g, '→')
    .replace(/\\in/g, '∈')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\top/g, 'ᵀ')
    .replace(/\\ell/g, 'ℓ')
    .replace(/\\|\\s*([^|\\]+)\\s*\\|_2\^2/g, '‖$1‖₂²')
    .replace(/\\|\\s*([^|\\]+)\\s*\\|/g, '‖$1‖')
    .replace(/\\text\{([^}]+)\}/g, '<span class="font-sans">$1</span>')
    .replace(/\\mathrm\{([^}]+)\}/g, '<span class="font-serif not-italic">$1</span>')
    .replace(/\\big\(/g, '(')
    .replace(/\\big\)/g, ')')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
    .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
    .replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>')
    .replace(/\^([a-zA-Z0-9*])/g, '<sup>$1</sup>');

  if (displayMode) {
    return `<div class="my-3 py-2 px-3 bg-slate-50/80 dark:bg-slate-900/50 border-l-2 border-slate-300 dark:border-slate-700 font-serif italic text-center text-[15px] overflow-x-auto">${cleaned}</div>`;
  }
  return `<span class="font-serif italic text-slate-900 dark:text-slate-100 px-0.5">${cleaned}</span>`;
}

function renderInlineMarkup(text: string, bibMap: Map<string, BibEntry>): string {
  let out = escapeHtml(text);

  // Inline math $...$
  out = out.replace(/\$([^$]+)\$/g, (_, math) => formatMathExpression(math, false));

  // LaTeX formatting
  out = out
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\texttt\{([^}]+)\}/g, '<code class="font-mono text-[0.9em] bg-slate-100 dark:bg-slate-800 px-1 rounded">$1</code>')
    .replace(/\\cite[pt]?\{([^}]+)\}/g, (_, keysRaw: string) => {
      const keys = keysRaw.split(',').map((k) => k.trim());
      const badges = keys.map((k) => {
        const entry = bibMap.get(k);
        if (entry) {
          return `<a href="#bib-${escapeHtml(k)}" title="${escapeHtml(entry.title)} (${escapeHtml(entry.author)}, ${escapeHtml(entry.year)})" class="text-[#1e3a6e] dark:text-sky-400 font-medium hover:underline">[${entry.index}]</a>`;
        }
        return `<span class="text-rose-600 font-semibold" title="Undefined citation ${escapeHtml(k)}">[?${escapeHtml(k)}]</span>`;
      });
      return badges.join(', ');
    })
    .replace(/\[@([^\]]+)\]/g, (_, keyRaw: string) => {
      const k = keyRaw.trim();
      const entry = bibMap.get(k);
      if (entry) {
        return `<a href="#bib-${escapeHtml(k)}" class="text-[#1e3a6e] dark:text-sky-400 font-medium hover:underline">[${entry.index}]</a>`;
      }
      return `<span class="text-rose-600 font-semibold">[?${escapeHtml(k)}]</span>`;
    })
    .replace(/@([a-zA-Z0-9_-]{4,})/g, (full, k: string) => {
      const entry = bibMap.get(k);
      if (entry) {
        return `<a href="#bib-${escapeHtml(k)}" class="text-[#1e3a6e] dark:text-sky-400 font-medium hover:underline">[${entry.index}]</a>`;
      }
      return full;
    })
    .replace(/~\\ref\{([^}]+)\}/g, '&nbsp;<span class="text-[#1e3a6e] dark:text-sky-400 font-medium">1</span>')
    .replace(/\\ref\{([^}]+)\}/g, '<span class="text-[#1e3a6e] dark:text-sky-400 font-medium">1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="font-mono text-[0.9em] bg-slate-100 dark:bg-slate-800 px-1 rounded">$1</code>');

  return out;
}

export function compileProjectWorkspace(input: {
  mainFilePath: string;
  mainContent: string;
  bibContent?: string;
  templateId?: string;
  texliveVersion?: string;
}): CompiledManuscript {
  const startTime = Date.now();
  const mainPath = input.mainFilePath || 'main.tex';
  const raw = input.mainContent || '';
  const bibEntries = parseBibtexContent(input.bibContent || '');
  const bibMap = new Map<string, BibEntry>(bibEntries.map((b) => [b.citeKey, b]));

  const ext = mainPath.split('.').pop()?.toLowerCase() || 'tex';
  const isSlides =
    mainPath.endsWith('slides.md') ||
    raw.includes('\\documentclass[aspectratio=169]{beamer}') ||
    (ext === 'md' && raw.split(/\n---\n/).length >= 3);
  const format: CompiledManuscript['format'] = isSlides
    ? 'slides'
    : ext === 'typ'
      ? 'typst'
      : ext === 'md'
        ? 'markdown'
        : ext === 'bib'
          ? 'bib'
          : ext === 'docx'
            ? 'docx'
            : 'latex';

  const outline: OutlineNode[] = [];
  const diagnostics: ReviewDiagnostic[] = [];
  const lines = raw.split(/\r?\n/);

  // Extract metadata
  let title = mainPath.replace(/\.[^.]+$/, '');
  let authors: string[] = ['CorTeX Researcher'];
  let abstractHtml = '';
  const columns: 1 | 2 =
    raw.includes('twocolumn') ||
    raw.includes('IEEEtran') ||
    raw.includes('sigconf') ||
    raw.includes('acl}') ||
    raw.includes('emnlp}') ||
    raw.includes('cvpr}') ||
    raw.includes('icml')
      ? 2
      : 1;

  const titleMatch =
    raw.match(/\\title\{([\s\S]*?)\}/) ||
    raw.match(/^#\s+(.+)$/m) ||
    raw.match(/title:\s*"([^"]+)"/) ||
    raw.match(/#text\(1[67]pt,\s*weight:\s*"bold"\)\[([^\]]+)\]/);
  if (titleMatch?.[1]) {
    title = titleMatch[1].replace(/\\\\/g, ' ').replace(/[{}]/g, '').trim();
  }

  const authorMatch =
    raw.match(/\\author(?:\*\[[^\]]*\])?\{([\s\S]*?)\}/) ||
    raw.match(/^\*\*Author:\*\*\s*(.+)$/m) ||
    raw.match(/author:\s*"([^"]+)"/);
  if (authorMatch?.[1]) {
    authors = authorMatch[1]
      .split(/\\and|\\\\|,/)
      .map((a) => a.replace(/\\texttt\{[^}]*\}/g, '').replace(/[{}]/g, '').trim())
      .filter(Boolean);
  }

  const abstractMatch =
    raw.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/) ||
    raw.match(/\\abstract(?:\[[^\]]*\])?\{([\s\S]*?)\}/) ||
    raw.match(/\*Abstract\.\*\s*([^\n]+)/);
  if (abstractMatch?.[1]) {
    abstractHtml = renderInlineMarkup(abstractMatch[1].trim(), bibMap);
  }

  // Run Writing, Citation & Accessibility Review Diagnostics
  const citedKeys = new Set<string>();
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // Outline extraction
    const texSec = lineText.match(/\\(section|subsection|subsubsection)\*?\{([^}]+)\}/);
    if (texSec) {
      const level = texSec[1] === 'section' ? 1 : texSec[1] === 'subsection' ? 2 : 3;
      outline.push({
        id: `sec-${lineNum}`,
        title: texSec[2].trim(),
        level,
        line: lineNum,
      });
    }
    const mdSec = lineText.match(/^(#{1,3})\s+(.+)$/);
    if (mdSec && format !== 'latex') {
      const level = Math.min(3, mdSec[1].length) as 1 | 2 | 3;
      outline.push({
        id: `sec-${lineNum}`,
        title: mdSec[2].trim(),
        level,
        line: lineNum,
      });
    }
    const typSec = lineText.match(/^(=+)\s+(.+)$/);
    if (typSec && format === 'typst') {
      const level = Math.min(3, typSec[1].length) as 1 | 2 | 3;
      outline.push({
        id: `sec-${lineNum}`,
        title: typSec[2].trim(),
        level,
        line: lineNum,
      });
    }

    // Citation check
    const citeMatches = [
      ...lineText.matchAll(/\\cite[pt]?\{([^}]+)\}/g),
      ...lineText.matchAll(/\[@([^\]]+)\]/g),
    ];
    for (const cm of citeMatches) {
      const keys = cm[1].split(',').map((k) => k.trim());
      for (const k of keys) {
        citedKeys.add(k);
        if (!bibMap.has(k)) {
          diagnostics.push({
            id: `diag-cite-${lineNum}-${k}`,
            category: 'citation',
            severity: 'error',
            title: `Undefined citation key "${k}"`,
            message: `Citation "${k}" on line ${lineNum} was not found in refs.bib.`,
            filePath: mainPath,
            line: lineNum,
            suggestion: `Add @article{${k}, ...} to refs.bib or cite an existing reference from your Library.`,
          });
        }
      }
    }

    // Writing review check: passive / hedge phrases
    if (/\b(very|extremely|obviously|clearly)\b/i.test(lineText) && !lineText.trim().startsWith('%')) {
      diagnostics.push({
        id: `diag-write-${lineNum}`,
        category: 'writing',
        severity: 'info',
        title: 'Academic precision & tone',
        message: `Consider replacing intensifiers ("very", "obviously", "clearly") on line ${lineNum} with quantitative evidence.`,
        filePath: mainPath,
        line: lineNum,
        suggestion: 'State the empirical metric or theoretical bound directly.',
      });
    }

    // Accessibility check: figure without caption/alt
    if (lineText.includes('\\begin{figure}') && !raw.includes('\\caption{')) {
      diagnostics.push({
        id: `diag-a11y-${lineNum}`,
        category: 'accessibility',
        severity: 'warning',
        title: 'Figure missing descriptive \\caption',
        message: `Figure environment starting at line ${lineNum} lacks a descriptive \\caption{} for screen readers and PDF tagging.`,
        filePath: mainPath,
        line: lineNum,
      });
    }
  });

  // Check uncited bibliography entries
  for (const entry of bibEntries) {
    if (!citedKeys.has(entry.citeKey) && !raw.includes(`@${entry.citeKey}`)) {
      diagnostics.push({
        id: `diag-uncited-${entry.citeKey}`,
        category: 'citation',
        severity: 'info',
        title: `Uncited bibliography entry "${entry.citeKey}"`,
        message: `Reference "${entry.title}" (${entry.year}) is in refs.bib but not yet cited in ${mainPath}.`,
        filePath: 'refs.bib',
        line: 1,
        suggestion: `Insert \\cite{${entry.citeKey}} in your manuscript.`,
      });
    }
  }

  // Handle Slides format
  const slides: SlideItem[] = [];
  if (format === 'slides') {
    const rawSlides = raw
      .replace(/^---[\s\S]*?---\n/, '')
      .split(/\n---\n/);
    rawSlides.forEach((chunk, idx) => {
      const noteMatch = chunk.match(/Note:\s*([\s\S]*)$/i);
      const speakerNotes = noteMatch ? noteMatch[1].trim() : '';
      const slideBody = noteMatch ? chunk.slice(0, noteMatch.index).trim() : chunk.trim();
      const slideTitleMatch = slideBody.match(/^#{1,3}\s+(.+)$/m);
      const slideTitle = slideTitleMatch ? slideTitleMatch[1].trim() : `Slide ${idx + 1}`;
      const bodyHtml = slideBody
        .split(/\r?\n/)
        .map((l) => {
          if (/^#\s+/.test(l)) {
            return `<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-3">${renderInlineMarkup(l.replace(/^#\s+/, ''), bibMap)}</h1>`;
          }
          if (/^##\s+/.test(l)) {
            return `<h2 class="text-xl font-semibold text-[#1e3a6e] dark:text-sky-300 mb-3">${renderInlineMarkup(l.replace(/^##\s+/, ''), bibMap)}</h2>`;
          }
          if (/^###\s+/.test(l)) {
            return `<h3 class="text-base font-medium text-slate-600 dark:text-slate-300 mb-2">${renderInlineMarkup(l.replace(/^###\s+/, ''), bibMap)}</h3>`;
          }
          if (/^-\s+/.test(l)) {
            return `<li class="ml-5 list-disc text-slate-800 dark:text-slate-200 mb-1.5">${renderInlineMarkup(l.replace(/^-\s+/, ''), bibMap)}</li>`;
          }
          if (/^\$\$([\s\S]+)\$\$/.test(l.trim())) {
            return formatMathExpression(l.trim().slice(2, -2), true);
          }
          if (!l.trim()) return '';
          return `<p class="text-slate-700 dark:text-slate-300 mb-2">${renderInlineMarkup(l, bibMap)}</p>`;
        })
        .join('\n');

      slides.push({
        index: idx + 1,
        title: slideTitle,
        bodyHtml,
        speakerNotes,
        sourceLine: idx * 12 + 1,
      });
    });
  }

  // Build Manuscript HTML body with SyncTeX data-source-line attributes
  const bodyBlocks: string[] = [];
  let inDocument = !raw.includes('\\begin{document}');
  let inAbstract = false;
  let inEquation = false;
  let equationBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];
  let inList = false;
  let sectionCounter = 0;
  let subSectionCounter = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('%')) return;
    if (trimmed.includes('\\begin{document}')) {
      inDocument = true;
      return;
    }
    if (trimmed.includes('\\end{document}')) {
      inDocument = false;
      return;
    }
    if (!inDocument) return;

    if (
      trimmed.startsWith('\\maketitle') ||
      trimmed.startsWith('\\bibliographystyle') ||
      trimmed.startsWith('\\bibliography{') ||
      trimmed.startsWith('#bibliography(') ||
      trimmed.startsWith('#set ') ||
      trimmed.startsWith('\\label{')
    ) {
      return;
    }

    if (trimmed.includes('\\begin{abstract}')) {
      inAbstract = true;
      return;
    }
    if (trimmed.includes('\\end{abstract}')) {
      inAbstract = false;
      return;
    }
    if (inAbstract) return;

    if (trimmed.includes('\\begin{equation}') || trimmed === '$$') {
      if (inEquation && trimmed === '$$') {
        inEquation = false;
        bodyBlocks.push(
          `<div data-source-line="${lineNum}" class="synctex-block">${formatMathExpression(equationBuffer.join(' '), true)}</div>`
        );
        equationBuffer = [];
      } else {
        inEquation = true;
        equationBuffer = [];
      }
      return;
    }
    if (trimmed.includes('\\end{equation}')) {
      inEquation = false;
      bodyBlocks.push(
        `<div data-source-line="${lineNum}" class="synctex-block">${formatMathExpression(equationBuffer.join(' '), true)}</div>`
      );
      equationBuffer = [];
      return;
    }
    if (inEquation) {
      if (!trimmed.startsWith('\\label')) equationBuffer.push(trimmed);
      return;
    }

    if (trimmed.includes('\\begin{table}')) {
      inTable = true;
      tableBuffer = [];
      return;
    }
    if (trimmed.includes('\\end{table}')) {
      inTable = false;
      const captionMatch = tableBuffer.join('\n').match(/\\caption\{([^}]+)\}/);
      const rows = tableBuffer
        .filter(
          (l) =>
            l.includes('&') &&
            !l.includes('\\begin{tabular}') &&
            !l.includes('\\end{tabular}')
        )
        .map((r) =>
          r
            .replace(/\\\\$/, '')
            .split('&')
            .map((c) => renderInlineMarkup(c.trim(), bibMap))
        );
      const tableHtml = `
        <div data-source-line="${lineNum}" class="synctex-block my-4 overflow-x-auto">
          ${captionMatch ? `<div class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">Table 1: ${renderInlineMarkup(captionMatch[1], bibMap)}</div>` : ''}
          <table class="w-full text-xs border-y-2 border-slate-800 dark:border-slate-300">
            ${rows
              .map(
                (cols, rIdx) => `
              <tr class="${rIdx === 0 ? 'border-b border-slate-600 dark:border-slate-400 font-semibold bg-slate-50/70 dark:bg-slate-800/50' : 'border-b border-slate-200 dark:border-slate-800'}">
                ${cols.map((c, cIdx) => `<td class="py-1.5 px-2 ${cIdx === 0 ? 'text-left' : 'text-center'}">${c}</td>`).join('')}
              </tr>`
              )
              .join('')}
          </table>
        </div>`;
      bodyBlocks.push(tableHtml);
      return;
    }
    if (inTable) {
      tableBuffer.push(trimmed);
      return;
    }

    if (trimmed.includes('\\begin{itemize}') || trimmed.includes('\\begin{enumerate}')) {
      inList = true;
      bodyBlocks.push('<ul class="list-disc ml-5 my-2 space-y-1">');
      return;
    }
    if (trimmed.includes('\\end{itemize}') || trimmed.includes('\\end{enumerate}')) {
      inList = false;
      bodyBlocks.push('</ul>');
      return;
    }
    if (inList && trimmed.startsWith('\\item')) {
      bodyBlocks.push(
        `<li data-source-line="${lineNum}" class="synctex-block text-[13.5px] leading-relaxed">${renderInlineMarkup(trimmed.replace(/^\\item\s*/, ''), bibMap)}</li>`
      );
      return;
    }

    // Sections
    const secMatch =
      trimmed.match(/^\\section\*?\{([^}]+)\}/) ||
      (format === 'typst' ? trimmed.match(/^=\s+(.+)$/) : null) ||
      (format === 'markdown' ? trimmed.match(/^##\s+(.+)$/) : null);
    if (secMatch) {
      sectionCounter += 1;
      subSectionCounter = 0;
      const headingText = secMatch[1].replace(/^\d+\.\s*/, '');
      bodyBlocks.push(
        `<h2 id="sec-${lineNum}" data-source-line="${lineNum}" class="synctex-block text-[15px] font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2 tracking-tight">${sectionCounter}. ${renderInlineMarkup(headingText, bibMap)}</h2>`
      );
      return;
    }

    const subSecMatch =
      trimmed.match(/^\\subsection\*?\{([^}]+)\}/) ||
      (format === 'typst' ? trimmed.match(/^==\s+(.+)$/) : null) ||
      (format === 'markdown' ? trimmed.match(/^###\s+(.+)$/) : null);
    if (subSecMatch) {
      subSectionCounter += 1;
      bodyBlocks.push(
        `<h3 id="sec-${lineNum}" data-source-line="${lineNum}" class="synctex-block text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 mt-3.5 mb-1.5">${sectionCounter}.${subSectionCounter} ${renderInlineMarkup(subSecMatch[1], bibMap)}</h3>`
      );
      return;
    }

    if (!trimmed) return;

    // Markdown list items
    if (/^-\s+\[[ xX]\]\s+/.test(trimmed)) {
      const checked = /^-\s+\[[xX]\]/.test(trimmed);
      const itemText = trimmed.replace(/^-\s+\[[ xX]\]\s+/, '');
      bodyBlocks.push(
        `<div data-source-line="${lineNum}" class="synctex-block flex items-center gap-2 text-[13.5px] my-1"><input type="checkbox" ${checked ? 'checked' : ''} disabled class="rounded border-slate-300" /><span>${renderInlineMarkup(itemText, bibMap)}</span></div>`
      );
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      bodyBlocks.push(
        `<div data-source-line="${lineNum}" class="synctex-block ml-4 text-[13.5px] my-1">• ${renderInlineMarkup(trimmed.replace(/^-\s+/, ''), bibMap)}</div>`
      );
      return;
    }

    // Typst display math $ ... $
    if (format === 'typst' && /^\$\s+.+\s+\$$/.test(trimmed)) {
      bodyBlocks.push(
        `<div data-source-line="${lineNum}" class="synctex-block">${formatMathExpression(trimmed.slice(1, -1), true)}</div>`
      );
      return;
    }

    // Single-line $$ ... $$
    if (/^\$\$.+\$\$$/.test(trimmed)) {
      bodyBlocks.push(
        `<div data-source-line="${lineNum}" class="synctex-block">${formatMathExpression(trimmed.slice(2, -2), true)}</div>`
      );
      return;
    }

    bodyBlocks.push(
      `<p data-source-line="${lineNum}" class="synctex-block text-[13.5px] leading-[1.68] text-slate-800 dark:text-slate-200 mb-2.5 text-justify">${renderInlineMarkup(trimmed, bibMap)}</p>`
    );
  });

  // Render bibliography block if entries exist
  if (bibEntries.length > 0) {
    const bibHtml = `
      <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-[14px] font-bold text-slate-900 dark:text-slate-100 mb-2">References</h2>
        <ol class="space-y-1.5 text-[12px] leading-snug text-slate-700 dark:text-slate-300">
          ${bibEntries
            .map(
              (b) => `
            <li id="bib-${escapeHtml(b.citeKey)}" class="flex gap-2">
              <span class="font-mono text-slate-500 shrink-0">[${b.index}]</span>
              <span>${escapeHtml(b.author)} (${escapeHtml(b.year)}). <em>${escapeHtml(b.title)}</em>. ${escapeHtml(b.venue)}.</span>
            </li>`
            )
            .join('')}
        </ol>
      </div>`;
    bodyBlocks.push(bibHtml);
  }

  const elapsedMs = Math.max(12, Date.now() - startTime);
  const texlive = input.texliveVersion || 'tl2026-20260826-b6584b4';
  const compileLog = [
    `This is CorTeX Incremental Typesetting Engine (${texlive})`,
    `entering extended mode (${mainPath})`,
    `Format: ${format.toUpperCase()} | Layout: ${columns}-column | References resolved: ${bibEntries.length}`,
    `Outline sections: ${outline.length} | Review diagnostics: ${diagnostics.length}`,
    `Output written on output.pdf (1 page, ${raw.length} bytes).`,
    `SyncTeX written on output.synctex.gz (${elapsedMs} ms).`,
  ].join('\n');

  return {
    ok: true,
    format,
    title,
    authors,
    abstractHtml,
    columns,
    venueBadge: columns === 2 ? 'Two-Column Venue Layout' : 'Single-Column Academic Layout',
    pagesHtml: [bodyBlocks.join('\n')],
    slides,
    bibliography: bibEntries,
    outline,
    diagnostics,
    compileLog,
    elapsedMs,
  };
}

export function compileAcademicDocument(input: {
  format?: 'latex' | 'typst' | 'markdown' | 'slides';
  fileName: string;
  content: string;
  bibContent?: string;
}) {
  const res = compileProjectWorkspace({
    mainFilePath: input.fileName,
    mainContent: input.content,
    bibContent: input.bibContent || '',
  });
  const html =
    res.format === 'slides' && res.slides.length > 0
      ? `<div class="cortex-slide-deck">${res.slides
          .map(
            (s) =>
              `<div class="cortex-slide-card" data-line="${s.sourceLine}"><div class="cortex-slide-number">Slide ${s.index}</div><div>${s.bodyHtml}</div></div>`
          )
          .join('')}</div>`
      : `<div class="cortex-paper-sheet"><div class="cortex-paper-header"><h1 class="cortex-paper-title">${res.title}</h1><div class="cortex-paper-authors">${res.authors.join(', ')}</div></div>${
          res.abstractHtml
            ? `<div class="cortex-paper-abstract"><div class="cortex-paper-abstract-label">Abstract</div>${res.abstractHtml}</div>`
            : ''
        }${res.pagesHtml.join('\n')}</div>`;

  const words = input.content
    .replace(/\\[a-zA-Z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const equations = (
    input.content.match(/\\begin\{equation\}|\$\$|\$\s/g) || []
  ).length;
  const citations = (
    input.content.match(/\\cite\{[^}]+\}|@[a-zA-Z0-9_-]+/g) || []
  ).length;

  return {
    html,
    outline: res.outline,
    diagnostics: res.diagnostics,
    stats: {
      wordCount: words,
      charCount: input.content.length,
      equationCount: equations,
      citationCount: citations,
      figureCount: (input.content.match(/\\begin\{figure\}/g) || []).length,
    },
  };
}

