export interface DocArticle {
  slug: string;
  title: string;
  category:
    | 'Getting started'
    | 'Features'
    | 'Guides'
    | 'CorTeX tips'
    | 'Troubleshooting'
    | 'Articles';
  summary: string;
  readTime: string;
  content: string;
}

export const DOC_CATEGORIES = [
  'Getting started',
  'Features',
  'Guides',
  'CorTeX tips',
  'Troubleshooting',
  'Articles',
] as const;

export const LEARN_LATEX_FIVE_STEPS = [
  {
    step: 1,
    title: 'Create a project from a venue template',
    slug: 'create-first-project',
    description:
      'Pick from 104 official conference and journal layouts (NeurIPS, ICLR, ACL, IEEE, ACM, Springer Nature) or start with a Blank Article.',
  },
  {
    step: 2,
    title: 'Switch between Visual, Source, and Preview',
    slug: 'visual-and-source-modes',
    description:
      'Write prose in Visual mode, fine-tune macros in </> Source mode, and click any paragraph in Preview to jump via SyncTeX.',
  },
  {
    step: 3,
    title: 'Typeset equations, figures, and tables',
    slug: 'math-figures-and-tables',
    description:
      'Use inline $...$ and display \\[...\\] equations, booktabs tables, and labeled figures with automatic cross-references.',
  },
  {
    step: 4,
    title: 'Collect papers in Library and cite with BibTeX',
    slug: 'library-and-citations',
    description:
      'Search scholarly papers in /app/library, highlight PDFs, and insert verified \\cite{key} references directly into your manuscript.',
  },
  {
    step: 5,
    title: 'Collaborate, review with Orca AI, and export',
    slug: 'collaborate-and-orca-ai',
    description:
      'Invite coauthors with granular file/project permissions, review Orca AI diff proposals, and export print-ready PDFs or ZIP archives.',
  },
];

export const FIND_YOUR_TASK_ROWS = [
  {
    task: 'Start a paper for NeurIPS, ICLR, ICML, ACL, or IEEE',
    where: 'Home (/app) → + New project',
    slug: 'create-first-project',
  },
  {
    task: 'Insert an academic transition phrase or limitation statement',
    where: 'Editor → Type / at the start of a line',
    slug: 'academic-phrasebank',
  },
  {
    task: 'Ask Orca AI to tighten a paragraph or fix a LaTeX table',
    where: 'Left Sidebar → Review / AI tab',
    slug: 'collaborate-and-orca-ai',
  },
  {
    task: 'Search scholarly papers and import BibTeX citations',
    where: 'Research Library (/app/library) → Web search',
    slug: 'library-and-citations',
  },
  {
    task: 'Share only a specific file or folder with a coauthor',
    where: 'Project Workspace → Share & access modal',
    slug: 'sharing-and-permissions',
  },
  {
    task: 'Compare versions or restore an earlier milestone',
    where: 'Left Sidebar → Version history tab',
    slug: 'version-history-and-git',
  },
];

export const DOC_ARTICLES: readonly DocArticle[] = [
  {
    slug: 'create-first-project',
    title: 'Creating your first project & choosing a venue template',
    category: 'Getting started',
    summary:
      'How to start a new LaTeX, Typst, Markdown, or Slide project using CorTeX’s 104 curated conference and journal templates.',
    readTime: '3 min read',
    content: `## Creating a project in CorTeX

From your signed-in home at \`/app\`, click **+ New project** in the Projects panel.

### 1. Browse or search 104 venue templates
CorTeX organizes templates into 10 categories:
- **General formats**: Blank Article, Technical Report, Book, Beamer Slides, Academic Letter, Typst Academic Paper
- **Publisher formats**: IEEE Conference, IEEE Transactions, ACM sigconf/acmsmall, Springer Nature (\`sn-jnl\`), LNCS, Elsevier, APS REVTeX 4.2, Wiley NJD v5, Taylor & Francis, PLOS ONE, IOP, MDPI, Oxford University Press
- **NLP conferences**: ACL, EMNLP, NAACL, EACL, COLING, COLM, TACL, LREC
- **AI & machine learning**: NeurIPS 2026, ICML 2026, ICLR 2027, AAAI 2027, IJCAI, AISTATS, UAI, JMLR, TMLR, CoRL, ECAI
- **Vision & robotics**: CVPR 2027, ICCV, ECCV, WACV, BMVC, MICCAI, ICRA, IROS, RSS, SIGGRAPH
- **Systems & security**: USENIX OSDI, NSDI, Security, FAST, ATC, ACM SOSP, EuroSys, SIGCOMM, CCS, IEEE S&P, NDSS, ASPLOS, ISCA
- **Data, HCI & web**: ACM CHI, UIST, CSCW, UbiComp, SIGMOD, VLDB, ICDE, KDD, WWW, SIGIR, WSDM, CIKM, RecSys, ICWSM
- **Software & programming languages**: PLDI, POPL, OOPSLA, ICFP, ICSE, FSE, ASE, ISSTA, CAV, TACAS, ESOP, ECOOP
- **Theory & algorithms**: STOC, FOCS, SODA, ICALP, ESA, COLT, ITCS, LICS, PODC, IACR CRYPTO
- **Markdown**: Markdown Research Note, Slide Deck, Literature Review Matrix, Experiment Lab Log, Grant Proposal, Peer Review Rebuttal

### 2. Select your TeX Live compile profile
Every project pins a reproducible TeX Live snapshot (\`tl2026-20260826-b6584b4\`) so your paper compiles identically today and months later.`,
  },
  {
    slug: 'visual-and-source-modes',
    title: 'Working in Visual, Source, and Live Preview modes',
    category: 'Features',
    summary:
      'Switch seamlessly between structured Visual editing, raw LaTeX/Typst/Markdown source code, and synchronized Preview.',
    readTime: '4 min read',
    content: `## Three synchronized views of your manuscript

CorTeX lets every coauthor work in the representation they prefer:

1. **Visual Mode**: Focus on prose, section structure, inline equations, and citations without visual clutter from LaTeX preamble macros.
2. **\`</> Source\` Mode**: Full syntax-highlighted editor with line numbers, bracket matching, \`⌘P\` Quick Open, and project-wide search & replace.
3. **Preview Mode**: Live paginated academic layout with 1-column or 2-column rendering, clickable SyncTeX source-line navigation, zoom controls, and one-click PDF/HTML download.`,
  },
  {
    slug: 'math-figures-and-tables',
    title: 'Typesetting mathematics, tables, and figures',
    category: 'Guides',
    summary:
      'Reference guide for inline and display equations, booktabs tables, figure environments, and cross-references.',
    readTime: '5 min read',
    content: `## Mathematical typesetting & structured environments

### Inline and display math
- Use \`$E = mc^2$\` for inline mathematical expressions.
- Use \`\\begin{equation} ... \\end{equation}\` or \`$$ ... $$\` for numbered display equations.

### Publication-quality tables
Always prefer \`booktabs\` (\`\\toprule\`, \`\\midrule\`, \`\\bottomrule\`) over vertical rules for clean conference-compliant tables.`,
  },
  {
    slug: 'library-and-citations',
    title: 'Research Library, Web Search, and BibTeX citations',
    category: 'Features',
    summary:
      'Discover scholarly papers via Web search, organize references with tags and facets, annotate PDFs, and cite in one click.',
    readTime: '4 min read',
    content: `## Read a paper. Bring its evidence into your draft.

Open \`/app/library\` to access your personal Research Library:

1. **In Library vs. Web search**: Search your saved references or switch to **Web search** to query scholarly databases with citation counts, venue metadata, and abstracts.
2. **Faceted filtering**: Filter by hierarchical tags, publication year range, authors, or journals & conferences.
3. **Interactive Reader & Annotations**: Open any reference to highlight passages and attach anchored sticky notes.
4. **Cite in Project**: Click **Cite in project** to automatically append the BibTeX record to your project's \`refs.bib\` file and copy \`\\cite{citeKey}\`.`,
  },
  {
    slug: 'collaborate-and-orca-ai',
    title: 'Orca AI Assistant & Academic Review Diagnostics',
    category: 'Features',
    summary:
      'How Orca AI proposes transparent diff patches that you can Accept or Dismiss, plus Writing, Citation, and Accessibility reviews.',
    readTime: '4 min read',
    content: `## AI that proposes. You decide.

In the left sidebar of any project workspace, open the **Review** tab:

- **Orca AI Assistant**: Ask Orca to tighten an abstract, convert a markdown table to LaTeX \`booktabs\`, or explain a compilation warning. Every change is presented as an inspectable **Diff Proposal** with **Accept** and **Dismiss** buttons.
- **Writing, Citation & Accessibility Review**: Automated checks verify that every \`\\cite{...}\` key exists in your \`.bib\` files, every \`\\ref{...}\` matches a \`\\label{...}\`, and figures include descriptive captions.`,
  },
  {
    slug: 'academic-phrasebank',
    title: 'Using the "/" Academic Phrasebank in your draft',
    category: 'CorTeX tips',
    summary:
      'Trigger scholarly transition phrases, research gap statements, and limitation templates by typing / in the editor.',
    readTime: '2 min read',
    content: `## Instant scholarly transitions with \`/\`

Press \`/\` in the editor or click the **Phrasebank (\`/\`)** button in the formatting toolbar to browse curated academic transitions across:
- Establishing a research territory
- Identifying a niche / research gap
- Stating purpose & contributions
- Reporting & comparing results
- Discussing limitations
- Concluding & future work`,
  },
  {
    slug: 'sharing-and-permissions',
    title: 'Granular Project, Folder, and File Sharing',
    category: 'Guides',
    summary:
      'Invite coauthors as Viewer, Commenter, or Editor scoped to the entire project, a specific folder, or a single file.',
    readTime: '3 min read',
    content: `## Granular Access Control

Click the access badge (\`Private\` / \`Shared\`) or **Share & access** in any project to open the sharing dialog:
- **Scope**: Choose \`Entire project\`, a specific \`Folder\`, or an individual \`File\`.
- **People**: Invite collaborators by email with \`Viewer\`, \`Commenter\`, or \`Editor\` permissions.
- **Links**: Generate revocable share links with optional expiration dates.`,
  },
  {
    slug: 'version-history-and-git',
    title: 'Version History Milestones & GitHub Synchronization',
    category: 'Troubleshooting',
    summary:
      'Save named milestones, inspect side-by-side diffs, restore prior states, and sync with a GitHub repository.',
    readTime: '3 min read',
    content: `## Version History & Git Sync

Never lose a paragraph before a conference deadline:
- **Version History tab**: Save named snapshots (e.g., \`Pre-submission freeze\`), inspect file diffs against \`Current (live)\`, and restore any snapshot in one click.
- **GitHub tab**: Connect a GitHub repository URL and branch to commit and push workspace changes with full auditability.`,
  },
];

export const DOCS_ARTICLES = DOC_ARTICLES;

export const LATEX_BEGINNER_STEPS = [
  {
    step: 1,
    title: 'Document Structure & Preamble',
    explanation:
      'Every LaTeX manuscript begins with \\documentclass and package imports before \\begin{document}.',
    sampleCode: `\\documentclass[11pt]{article}
\\usepackage{amsmath,amssymb}
\\title{First Steps in LaTeX}
\\author{Researcher}
\\begin{document}
\\maketitle
Hello, scholarly world!
\\end{document}`,
  },
  {
    step: 2,
    title: 'Sections, Subsections & Emphasis',
    explanation:
      'Organize arguments with \\section{} and \\subsection{}, and use \\textbf{} or \\emph{} for emphasis.',
    sampleCode: `\\section{Introduction}
We investigate \\textbf{sparse spectral kernels} on \\emph{compact manifolds}.

\\subsection{Contributions}
Our framework unifies theory and experiment.`,
  },
  {
    step: 3,
    title: 'Inline & Display Mathematics',
    explanation:
      'Wrap inline math in $...$ and numbered equations in \\begin{equation} ... \\end{equation}.',
    sampleCode: `For any $x \\in \\mathbb{R}^d$, the Gaussian kernel satisfies:
\\begin{equation}
  K_\\sigma(x, y) = \\exp\\left(-\\frac{\\|x - y\\|^2}{2\\sigma^2}\\right).
\\end{equation}`,
  },
  {
    step: 4,
    title: 'Tables & Figures with Labels',
    explanation:
      'Use booktabs for publication-grade tables and \\label{} + \\ref{} for cross-referencing.',
    sampleCode: `\\begin{table}[h]
\\centering
\\caption{Benchmark Perplexity}
\\label{tab:results}
\\begin{tabular}{lc}
\\toprule
Method & PPL \\\\
\\midrule
CorTeX Spectral & \\textbf{12.4} \\\\
\\bottomrule
\\end{tabular}
\\end{table}`,
  },
  {
    step: 5,
    title: 'BibTeX Citations & Bibliography',
    explanation:
      'Reference entries from refs.bib using \\cite{key} to automatically format your bibliography.',
    sampleCode: `Transformer architectures \\cite{vaswani2017attention} and IO-aware kernels \\cite{dao2022flashattention} underpin modern LLMs.

\\bibliographystyle{plain}
\\bibliography{refs}`,
  },
];

export function findDocBySlug(slugPath: string) {
  const clean = (slugPath || '').replace(/^\/+|\/+$/g, '');
  const found =
    DOC_ARTICLES.find((a) => a.slug === clean) ||
    (clean === 'guides/latex-for-beginners'
      ? {
          slug: 'guides/latex-for-beginners',
          title: 'LaTeX for Beginners — 5-Step Interactive Guide',
          category: 'Guides' as const,
          summary:
            'Master LaTeX document structure, sections, mathematical typesetting, tables, and BibTeX citations in 5 interactive steps.',
          readTime: '5 min read',
          content:
            'Use the interactive 5-step sandbox below to practice LaTeX syntax and see live academic formatting.',
        }
      : DOC_ARTICLES[0]);

  return {
    ...found,
    sections: [
      {
        heading: found.title,
        body: found.content,
        code: clean.includes('latex')
          ? LATEX_BEGINNER_STEPS[0].sampleCode
          : undefined,
      },
    ],
  };
}

