export interface PhrasebankItem {
  id: string;
  category: string;
  label: string;
  snippet: string;
  latexSnippet: string;
  strength?: 'cautious' | 'neutral' | 'strong';
  constraint?: string;
}

export const PHRASEBANK_FAMILIES = [
  'All families',
  'Context & importance',
  'Prior work & gap',
  'Purpose & contribution',
  'Definition & formalization',
  'Design & method selection',
  'Data, materials & subjects',
  'Procedure & reproducibility',
  'Analysis & evaluation',
  'Reporting results',
  'Artifact reference (Table/Fig/Eq)',
  'Comparison & causality',
  'Interpretation & discussion',
  'Limitations & validity',
  'Conclusion & future work',
  'Document flow',
] as const;

/**
 * CorTeX "/" Academic Phrasebank — 16 rhetorical families with claim-strength & epistemological constraints
 */
export const ACADEMIC_PHRASEBANK: readonly PhrasebankItem[] = [
  {
    id: 'territory-1',
    category: 'Context & importance',
    label: 'Recent advances have demonstrated...',
    snippet:
      'Recent advances in this domain have demonstrated the effectiveness of structured representations across diverse benchmarks.',
    latexSnippet:
      'Recent advances in this domain have demonstrated the effectiveness of structured representations across diverse benchmarks~\\cite{vaswani2017attention}.',
    strength: 'neutral',
    constraint: 'Citation required',
  },
  {
    id: 'territory-2',
    category: 'Context & importance',
    label: 'A central question in...',
    snippet:
      'A central question in modern computational science is how to balance expressive modeling capacity with tractable inference.',
    latexSnippet:
      'A central question in modern computational science is how to balance expressive modeling capacity with tractable inference.',
    strength: 'neutral',
  },
  {
    id: 'niche-1',
    category: 'Prior work & gap',
    label: 'However, existing approaches remain limited by...',
    snippet:
      'However, existing approaches remain limited by their reliance on strong distributional assumptions that rarely hold in practice.',
    latexSnippet:
      'However, existing approaches remain limited by their reliance on strong distributional assumptions that rarely hold in practice.',
    strength: 'neutral',
    constraint: 'Citation required',
  },
  {
    id: 'niche-2',
    category: 'Prior work & gap',
    label: 'Despite these promising results, little attention has been paid to...',
    snippet:
      'Despite these promising results, comparatively little attention has been paid to worst-case stability under distribution shift.',
    latexSnippet:
      'Despite these promising results, comparatively little attention has been paid to worst-case stability under distribution shift.',
    strength: 'cautious',
  },
  {
    id: 'purpose-1',
    category: 'Purpose & contribution',
    label: 'In this paper, we propose...',
    snippet:
      'In this paper, we propose a unified framework that directly addresses these limitations through principled optimization.',
    latexSnippet:
      'In this paper, we propose a unified framework that directly addresses these limitations through principled optimization.',
    strength: 'strong',
  },
  {
    id: 'purpose-2',
    category: 'Purpose & contribution',
    label: 'Our main contributions can be summarized as follows...',
    snippet:
      'Our main contributions can be summarized as follows: (1) we formulate a tight theoretical bound; (2) we design an efficient algorithm; and (3) we validate its performance across standard benchmarks.',
    latexSnippet:
      'Our main contributions can be summarized as follows:\n\\begin{enumerate}\n  \\item We formulate a tight theoretical bound.\n  \\item We design an efficient algorithm.\n  \\item We validate its performance across standard benchmarks.\n\\end{enumerate}',
    strength: 'strong',
  },
  {
    id: 'definition-1',
    category: 'Definition & formalization',
    label: 'Formally, let X denote a compact metric space...',
    snippet:
      'Formally, let X denote a compact metric space equipped with a Borel probability measure.',
    latexSnippet:
      'Formally, let $(\\mathcal{X}, d)$ denote a compact metric space equipped with a Borel probability measure $\\mu$.',
    strength: 'neutral',
  },
  {
    id: 'method-1',
    category: 'Design & method selection',
    label: 'To isolate the effect of..., we adopt a two-stage protocol...',
    snippet:
      'To isolate the effect of representation capacity, we adopt a controlled two-stage evaluation protocol.',
    latexSnippet:
      'To isolate the effect of representation capacity, we adopt a controlled two-stage evaluation protocol.',
    strength: 'neutral',
  },
  {
    id: 'data-1',
    category: 'Data, materials & subjects',
    label: 'All datasets were partitioned into disjoint splits...',
    snippet:
      'All datasets were partitioned into disjoint training, validation, and held-out test splits using stratified sampling.',
    latexSnippet:
      'All datasets were partitioned into disjoint training, validation, and held-out test splits using stratified sampling.',
    strength: 'neutral',
  },
  {
    id: 'repro-1',
    category: 'Procedure & reproducibility',
    label: 'Hyperparameters were tuned on the validation split over 5 seeds...',
    snippet:
      'Hyperparameters were tuned exclusively on the validation split, and all reported metrics reflect mean ± standard deviation across 5 independent random seeds.',
    latexSnippet:
      'Hyperparameters were tuned exclusively on the validation split, and all reported metrics reflect mean $\\pm$ standard deviation across $5$ independent random seeds.',
    strength: 'neutral',
  },
  {
    id: 'analysis-1',
    category: 'Analysis & evaluation',
    label: 'We evaluate statistical significance using a paired permutation test...',
    snippet:
      'We evaluate statistical significance using a two-sided paired permutation test with Holm-Bonferroni correction.',
    latexSnippet:
      'We evaluate statistical significance using a two-sided paired permutation test ($p < 0.01$) with Holm--Bonferroni correction.',
    strength: 'strong',
    constraint: 'Statistical evidence required',
  },
  {
    id: 'results-1',
    category: 'Reporting results',
    label: 'As shown in Table 1, our method outperforms...',
    snippet:
      'As shown in Table 1, our method consistently outperforms prior state-of-the-art baselines by a substantial margin.',
    latexSnippet:
      'As shown in Table~\\ref{tab:main-results}, our method consistently outperforms prior state-of-the-art baselines by a substantial margin.',
    strength: 'strong',
    constraint: 'Statistical evidence required',
  },
  {
    id: 'artifact-1',
    category: 'Artifact reference (Table/Fig/Eq)',
    label: 'Figure 1 illustrates the trade-off between...',
    snippet:
      'Figure 1 illustrates the Pareto frontier between inference latency and out-of-distribution calibration error.',
    latexSnippet:
      'Figure~\\ref{fig:pareto} illustrates the Pareto frontier between inference latency and out-of-distribution calibration error (see Equation~\\eqref{eq:objective}).',
    strength: 'neutral',
  },
  {
    id: 'comparison-1',
    category: 'Comparison & causality',
    label: 'These observations are consistent with an association between...',
    snippet:
      'These observations are consistent with a positive association between spectral norm regularization and perturbation stability.',
    latexSnippet:
      'These observations are consistent with a positive association between spectral norm regularization and perturbation stability.',
    strength: 'cautious',
    constraint: 'Association only',
  },
  {
    id: 'interpretation-1',
    category: 'Interpretation & discussion',
    label: 'A plausible explanation for this behavior is...',
    snippet:
      'A plausible explanation for this behavior is that implicit curvature penalties suppress high-frequency gradient noise.',
    latexSnippet:
      'A plausible explanation for this behavior is that implicit curvature penalties suppress high-frequency gradient noise.',
    strength: 'cautious',
  },
  {
    id: 'limitations-1',
    category: 'Limitations & validity',
    label: 'One limitation of our current formulation is...',
    snippet:
      'One limitation of our current formulation is that it assumes clean supervision during the initial calibration stage; relaxing this assumption is an important direction for future work.',
    latexSnippet:
      'One limitation of our current formulation is that it assumes clean supervision during the initial calibration stage; relaxing this assumption is an important direction for future work.',
    strength: 'cautious',
  },
  {
    id: 'conclusion-1',
    category: 'Conclusion & future work',
    label: 'In summary, our findings suggest that...',
    snippet:
      'In summary, our findings suggest that coupling formal structure with empirical feedback yields more reliable scientific workflows.',
    latexSnippet:
      'In summary, our findings suggest that coupling formal structure with empirical feedback yields more reliable scientific workflows.',
    strength: 'neutral',
  },
  {
    id: 'flow-1',
    category: 'Document flow',
    label: 'The remainder of this paper is organized as follows...',
    snippet:
      'The remainder of this paper is organized as follows. Section 2 formalizes the problem setting, Section 3 presents our method, and Section 4 reports empirical evaluations.',
    latexSnippet:
      'The remainder of this paper is organized as follows. Section~\\ref{sec:method} formalizes our approach, and Section~\\ref{sec:experiments} reports empirical evaluations.',
    strength: 'neutral',
  },
];

export interface DefaultGalleryWork {
  id: string;
  title: string;
  summary: string;
  authorName: string;
  category: 'Papers' | 'Notes' | 'Slides' | 'Templates';
  format: 'latex' | 'typst' | 'markdown' | 'slides';
  tags: string[];
  updatedLabel: string;
  mainFileName: string;
  content: string;
}

export type GalleryWorkItem = DefaultGalleryWork;

export const DEFAULT_GALLERY_WORKS: DefaultGalleryWork[] = [
  {
    id: 'gal-linear-algebra',
    title: 'An Introduction to Linear Algebra',
    summary:
      'Vector spaces, linear transformations, eigenvalues, singular value decomposition, and spectral theorems typeset in clean LaTeX.',
    authorName: 'CorTeX Editorial',
    category: 'Papers',
    format: 'latex',
    tags: ['linear algebra', 'mathematics', 'textbook'],
    updatedLabel: 'Recently shared',
    mainFileName: 'main.tex',
    content: `\\documentclass[11pt]{article}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{booktabs}

\\title{An Introduction to Linear Algebra: Spectral Decomposition and Vector Spaces}
\\author{CorTeX Open Workspace}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
This monograph introduces finite-dimensional vector spaces, inner product spaces, orthogonal projections, and the Singular Value Decomposition (SVD) with applications to low-rank matrix approximation \\cite{knuth1984literate}.
\\end{abstract}

\\section{Vector Spaces and Linear Maps}
Let $V$ and $W$ be vector spaces over $\\mathbb{R}$. A mapping $T: V \\to W$ is linear if for all $u, v \\in V$ and $\\alpha, \\beta \\in \\mathbb{R}$:
\\begin{equation}
  T(\\alpha u + \\beta v) = \\alpha T(u) + \\beta T(v).
\\end{equation}

\\section{Eigenvalues and the Spectral Theorem}
Every real symmetric matrix $A \\in \\mathbb{R}^{n \\times n}$ admits an orthogonal diagonalization:
\\begin{equation}
  A = Q \\Lambda Q^\\top = \\sum_{i=1}^{n} \\lambda_i q_i q_i^\\top
\\end{equation}
where $Q^\\top Q = I_n$ and $\\Lambda = \\mathrm{diag}(\\lambda_1, \\dots, \\lambda_n)$.

\\section{Singular Value Decomposition}
For any matrix $M \\in \\mathbb{R}^{m \\times n}$ of rank $r$, there exist orthogonal matrices $U \\in \\mathbb{R}^{m \\times m}$ and $V \\in \\mathbb{R}^{n \\times n}$ such that $M = U \\Sigma V^\\top$.
\\end{document}`,
  },
  {
    id: 'gal-memo-md',
    title: 'memo.md — Technical Note on Transformer Scaling Laws',
    summary:
      'Compute-optimal scaling laws, KV-cache memory bounds, and flash-attention throughput analysis in Markdown with KaTeX.',
    authorName: 'CorTeX Research Lab',
    category: 'Notes',
    format: 'markdown',
    tags: ['computer science', 'markdown', 'technical note'],
    updatedLabel: 'Recently shared',
    mainFileName: 'memo.md',
    content: `# Technical Note: Compute-Optimal Scaling and KV-Cache Bounds

**Author:** CorTeX Research Lab  
**Topics:** \`computer science\`, \`markdown\`, \`technical note\`

## 1. Overview
Given a fixed FLOPs budget $C \\approx 6 N D$, the compute-optimal allocation balances model parameter count $N$ and training token count $D$ [@vaswani2017attention]:

$$L(N, D) = E + \\frac{A}{N^\\alpha} + \\frac{B}{D^\\beta}$$

## 2. KV-Cache Memory Footprint
For batch size $b$, sequence length $s$, layers $L$, attention heads $h$, and head dimension $d_h$:

| Precision | Bytes per Token | 32K Context (70B Model) |
| :--- | :---: | :---: |
| FP16 / BF16 | $4 L h_{kv} d_h$ | 10.5 GB |
| INT8 Quantized | $2 L h_{kv} d_h$ | 5.25 GB |
| FP4 Grouped | $1 L h_{kv} d_h$ | 2.63 GB |

## 3. Key Takeaways
- FlashAttention reduces HBM reads/writes from $\\mathcal{O}(s^2)$ to $\\mathcal{O}(s)$.
- Grouped-Query Attention (GQA) shrinks KV cache by $4\\times$–$8\\times$ with minimal perplexity degradation.
`,
  },
  {
    id: 'gal-typst-note',
    title: 'Convex Optimization & Dual Certificates in Typst',
    summary:
      'Lagrangian duality, KKT optimality conditions, and proximal gradient convergence proofs written in Typst.',
    authorName: 'Optimization Group',
    category: 'Templates',
    format: 'typst',
    tags: ['mathematics', 'computer science', 'technical note'],
    updatedLabel: 'Recently shared',
    mainFileName: 'main.typ',
    content: `#set page(paper: "us-letter")
#set text(size: 11pt)
#set heading(numbering: "1.")

#align(center)[
  #text(16pt, weight: "bold")[Convex Optimization & Dual Certificates]
]

= Primal and Dual Formulations
Consider the constrained optimization problem over $x in RR^n$:
$ min_x f_0(x) quad "subject to" quad f_i (x) <= 0, quad A x = b $

= KKT Optimality Conditions
Under Slater's condition, $x^*$ and $(lambda^*, nu^*)$ are primal-dual optimal if and only if stationarity, primal feasibility, dual feasibility, and complementary slackness $lambda_i^* f_i (x^*) = 0$ hold @knuth1984literate.
`,
  },
  {
    id: 'gal-research-slides',
    title: 'Colloquium Slides: Collaborative AI for Scientific Discovery',
    summary:
      '4-slide academic seminar deck demonstrating math equations, benchmark tables, and speaker notes.',
    authorName: 'CorTeX Team',
    category: 'Slides',
    format: 'slides',
    tags: ['computer science', 'markdown', 'technical note'],
    updatedLabel: 'Recently shared',
    mainFileName: 'slides.md',
    content: `---
title: "Collaborative AI for Scientific Discovery"
author: "CorTeX Team"
---

# Collaborative AI for Scientific Discovery

### Integrating Literature, Typesetting, and Verification
CorTeX Open Workspace

Note: Opening slide for department seminar.

---

## Why Unified Academic Workspaces Matter

- Over **104 conference and journal templates** require strict formatting compliance.
- Coauthors switch between LaTeX source, visual prose editing, and PDF proofs.
- Grounding every claim in verified \`.bib\` citations prevents hallucinated references [@vaswani2017attention].

$$\\mathcal{R}(\\pi) = \\mathbb{E}_{\\tau \\sim \\pi}\\left[\\sum_{t=0}^{T} \\gamma^t r(s_t, a_t)\\right]$$

Note: Highlight how SyncTeX and Visual mode bridge LaTeX experts and domain coauthors.
`,
  },
];
