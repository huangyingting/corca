export type VenueTemplateCategory =
  | 'General formats'
  | 'Publisher formats'
  | 'NLP conferences'
  | 'AI & machine learning'
  | 'Vision & robotics'
  | 'Systems & security'
  | 'Data, HCI & web'
  | 'Software & programming languages'
  | 'Theory & algorithms'
  | 'Markdown';

export interface VenueTemplate {
  id: string;
  name: string;
  badge: string;
  category: VenueTemplateCategory;
  description: string;
  format: 'latex' | 'typst' | 'markdown' | 'slides';
  columns: 1 | 2;
  documentClass: string;
}

export const VENUE_TEMPLATE_CATEGORIES: readonly ('All categories' | VenueTemplateCategory)[] = [
  'All categories',
  'General formats',
  'Publisher formats',
  'NLP conferences',
  'AI & machine learning',
  'Vision & robotics',
  'Systems & security',
  'Data, HCI & web',
  'Software & programming languages',
  'Theory & algorithms',
  'Markdown',
] as const;

/**
 * Exact 104 Academic Venue & Document Templates from cortex.corca.ai
 */
export const VENUE_TEMPLATES: readonly VenueTemplate[] = [
  // 1. General formats (6)
  {
    id: 'blank-article',
    name: 'Blank Article',
    badge: 'LaTeX',
    category: 'General formats',
    description: 'Minimal LaTeX article template for papers, notes, and drafts.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[11pt]{article}',
  },
  {
    id: 'blank-report',
    name: 'Technical Report',
    badge: 'LaTeX',
    category: 'General formats',
    description: 'Chapter-based report layout for technical reports and theses.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[11pt]{report}',
  },
  {
    id: 'blank-book',
    name: 'Book',
    badge: 'LaTeX',
    category: 'General formats',
    description: 'Book class with front matter, chapters, and bibliography.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[11pt]{book}',
  },
  {
    id: 'beamer-slides',
    name: 'Beamer Slides',
    badge: 'Slides',
    category: 'General formats',
    description: 'Presentation slide deck using the LaTeX Beamer class.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[aspectratio=169]{beamer}',
  },
  {
    id: 'blank-letter',
    name: 'Academic Letter',
    badge: 'LaTeX',
    category: 'General formats',
    description: 'Formal cover letter and rebuttal response template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[11pt]{letter}',
  },
  {
    id: 'typst-paper',
    name: 'Typst Academic Paper',
    badge: 'Typst',
    category: 'General formats',
    description: 'Modern Typst scientific article with automated bibliography and math.',
    format: 'typst',
    columns: 1,
    documentClass: '#set page(paper: "us-letter")',
  },

  // 2. Publisher formats (14)
  {
    id: 'ieee-conference',
    name: 'IEEE Conference',
    badge: 'IEEE',
    category: 'Publisher formats',
    description: 'Standard two-column IEEEtran conference proceedings layout.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[conference]{IEEEtran}',
  },
  {
    id: 'ieee-journal',
    name: 'IEEE Transactions',
    badge: 'IEEE',
    category: 'Publisher formats',
    description: 'IEEE Transactions journal submission template (IEEEtran).',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[journal]{IEEEtran}',
  },
  {
    id: 'acm-sigconf',
    name: 'ACM Conference (sigconf)',
    badge: 'ACM',
    category: 'Publisher formats',
    description: 'Standard two-column ACM acmart conference proceedings format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'acm-acmsmall',
    name: 'ACM Journal (acmsmall)',
    badge: 'ACM',
    category: 'Publisher formats',
    description: 'Single-column ACM journal and PACM proceedings layout.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall]{acmart}',
  },
  {
    id: 'springer-nature',
    name: 'Springer Nature',
    badge: 'Springer',
    category: 'Publisher formats',
    description: 'Springer Nature journal article template (sn-jnl).',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[pdflatex,sn-basic]{sn-jnl}',
  },
  {
    id: 'springer-lncs',
    name: 'Springer LNCS',
    badge: 'LNCS',
    category: 'Publisher formats',
    description: 'Lecture Notes in Computer Science (llncs) proceedings template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[runningheads]{llncs}',
  },
  {
    id: 'elsevier-elsarticle',
    name: 'Elsevier (elsarticle)',
    badge: 'Elsevier',
    category: 'Publisher formats',
    description: 'Elsevier journal submission template with numbered references.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[preprint,12pt]{elsarticle}',
  },
  {
    id: 'revtex-aps',
    name: 'APS / REVTeX 4.2',
    badge: 'APS',
    category: 'Publisher formats',
    description: 'Physical Review journals template using REVTeX 4.2.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[reprint,aps,prl]{revtex4-2}',
  },
  {
    id: 'wiley-njd',
    name: 'Wiley NJD v5',
    badge: 'Wiley',
    category: 'Publisher formats',
    description: 'Wiley New Journal Design (WileyNJDv5) research article.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[AMA,Times1COL]{WileyNJDv5}',
  },
  {
    id: 'taylor-francis',
    name: 'Taylor & Francis (Interact)',
    badge: 'T&F',
    category: 'Publisher formats',
    description: 'Taylor & Francis Interact journal layout.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[]{interact}',
  },
  {
    id: 'plos-one',
    name: 'PLOS ONE',
    badge: 'PLOS',
    category: 'Publisher formats',
    description: 'Public Library of Science manuscript submission format.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[10pt,letterpaper]{article}',
  },
  {
    id: 'iop-publishing',
    name: 'IOP Publishing',
    badge: 'IOP',
    category: 'Publisher formats',
    description: 'Institute of Physics (iopart) journal submission template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[12pt]{iopart}',
  },
  {
    id: 'mdpi-journal',
    name: 'MDPI Journal',
    badge: 'MDPI',
    category: 'Publisher formats',
    description: 'Multidisciplinary Digital Publishing Institute article format.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[journal,article,submit,pdftex,moreauthors]{Definitions/mdpi}',
  },
  {
    id: 'oup-oxford',
    name: 'Oxford University Press',
    badge: 'OUP',
    category: 'Publisher formats',
    description: 'Oxford University Press contemporary academic journal template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[unnumsec,webpdf,contemporary,large]{oup-authoring-template}',
  },

  // 3. NLP conferences (8)
  {
    id: 'acl',
    name: 'ACL Rolling Review / ACL',
    badge: 'ACL',
    category: 'NLP conferences',
    description: 'Association for Computational Linguistics two-column format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[11pt]{article}\\usepackage[review]{acl}',
  },
  {
    id: 'emnlp',
    name: 'EMNLP',
    badge: 'EMNLP',
    category: 'NLP conferences',
    description: 'Empirical Methods in Natural Language Processing submission format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[11pt]{article}\\usepackage[review]{emnlp}',
  },
  {
    id: 'naacl',
    name: 'NAACL',
    badge: 'NAACL',
    category: 'NLP conferences',
    description: 'North American Chapter of the ACL conference proceedings.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[11pt]{article}\\usepackage[review]{naacl}',
  },
  {
    id: 'eacl',
    name: 'EACL',
    badge: 'EACL',
    category: 'NLP conferences',
    description: 'European Chapter of the ACL two-column template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[11pt]{article}\\usepackage[review]{eacl}',
  },
  {
    id: 'coling',
    name: 'COLING',
    badge: 'COLING',
    category: 'NLP conferences',
    description: 'International Conference on Computational Linguistics template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[11pt]{article}\\usepackage[review]{coling}',
  },
  {
    id: 'colm',
    name: 'COLM',
    badge: 'COLM',
    category: 'NLP conferences',
    description: 'Conference on Language Modeling single-column template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass{article}\\usepackage[submission]{colm}',
  },
  {
    id: 'tacl',
    name: 'TACL',
    badge: 'TACL',
    category: 'NLP conferences',
    description: 'Transactions of the Association for Computational Linguistics.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[11pt,a4paper]{article}\\usepackage{tacl2021v1}',
  },
  {
    id: 'lrec',
    name: 'LREC',
    badge: 'LREC',
    category: 'NLP conferences',
    description: 'Language Resources and Evaluation Conference template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[10pt,a4paper]{article}\\usepackage{lrec}',
  },

  // 4. AI & machine learning (11)
  {
    id: 'neurips-2026',
    name: 'NeurIPS 2026',
    badge: 'NeurIPS',
    category: 'AI & machine learning',
    description: 'Neural Information Processing Systems 2026 conference template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass{article}\\usepackage{neurips_2026}',
  },
  {
    id: 'icml-2026',
    name: 'ICML 2026',
    badge: 'ICML',
    category: 'AI & machine learning',
    description: 'International Conference on Machine Learning two-column format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass{article}\\usepackage{icml2026}',
  },
  {
    id: 'iclr-2027',
    name: 'ICLR 2027',
    badge: 'ICLR',
    category: 'AI & machine learning',
    description: 'International Conference on Learning Representations 2027 format.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass{article}\\usepackage{iclr2027_conference,times}',
  },
  {
    id: 'aaai-2027',
    name: 'AAAI 2027',
    badge: 'AAAI',
    category: 'AI & machine learning',
    description: 'AAAI Conference on Artificial Intelligence two-column format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper]{article}\\usepackage[submission]{aaai2027}',
  },
  {
    id: 'ijcai',
    name: 'IJCAI',
    badge: 'IJCAI',
    category: 'AI & machine learning',
    description: 'International Joint Conference on Artificial Intelligence.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass{article}\\usepackage{ijcai}',
  },
  {
    id: 'aistats',
    name: 'AISTATS',
    badge: 'AISTATS',
    category: 'AI & machine learning',
    description: 'Artificial Intelligence and Statistics conference proceedings.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[twoside]{article}\\usepackage{aistats}',
  },
  {
    id: 'uai',
    name: 'UAI',
    badge: 'UAI',
    category: 'AI & machine learning',
    description: 'Conference on Uncertainty in Artificial Intelligence.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass{uai}',
  },
  {
    id: 'jmlr',
    name: 'JMLR',
    badge: 'JMLR',
    category: 'AI & machine learning',
    description: 'Journal of Machine Learning Research single-column article.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[twoside,11pt]{article}\\usepackage{jmlr2e}',
  },
  {
    id: 'tmlr',
    name: 'TMLR',
    badge: 'TMLR',
    category: 'AI & machine learning',
    description: 'Transactions on Machine Learning Research submission format.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[10pt]{article}\\usepackage{tmlr}',
  },
  {
    id: 'corl',
    name: 'CoRL',
    badge: 'CoRL',
    category: 'AI & machine learning',
    description: 'Conference on Robot Learning single-column format.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass{article}\\usepackage{corl}',
  },
  {
    id: 'ecai',
    name: 'ECAI',
    badge: 'ECAI',
    category: 'AI & machine learning',
    description: 'European Conference on Artificial Intelligence two-column format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass{ecai}',
  },

  // 5. Vision & robotics (10)
  {
    id: 'cvpr-2027',
    name: 'CVPR 2027',
    badge: 'CVPR',
    category: 'Vision & robotics',
    description: 'IEEE/CVF Computer Vision and Pattern Recognition 2027 template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[10pt,twocolumn,letterpaper]{article}\\usepackage[review]{cvpr}',
  },
  {
    id: 'iccv',
    name: 'ICCV',
    badge: 'ICCV',
    category: 'Vision & robotics',
    description: 'IEEE/CVF International Conference on Computer Vision.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[10pt,twocolumn,letterpaper]{article}\\usepackage[review]{iccv}',
  },
  {
    id: 'eccv',
    name: 'ECCV',
    badge: 'ECCV',
    category: 'Vision & robotics',
    description: 'European Conference on Computer Vision LNCS-based format.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[runningheads]{llncs}\\usepackage[review]{eccv}',
  },
  {
    id: 'wacv',
    name: 'WACV',
    badge: 'WACV',
    category: 'Vision & robotics',
    description: 'Winter Conference on Applications of Computer Vision.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[10pt,twocolumn,letterpaper]{article}\\usepackage{wacv}',
  },
  {
    id: 'bmvc',
    name: 'BMVC',
    badge: 'BMVC',
    category: 'Vision & robotics',
    description: 'British Machine Vision Conference template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass{bmvc2k}',
  },
  {
    id: 'miccai',
    name: 'MICCAI',
    badge: 'MICCAI',
    category: 'Vision & robotics',
    description: 'Medical Image Computing and Computer Assisted Intervention.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[runningheads]{llncs}',
  },
  {
    id: 'icra',
    name: 'IEEE ICRA',
    badge: 'ICRA',
    category: 'Vision & robotics',
    description: 'IEEE International Conference on Robotics and Automation.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper, 10 pt, conference]{ieeeconf}',
  },
  {
    id: 'iros',
    name: 'IEEE/RSJ IROS',
    badge: 'IROS',
    category: 'Vision & robotics',
    description: 'Intelligent Robots and Systems conference format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper, 10 pt, conference]{ieeeconf}',
  },
  {
    id: 'rss',
    name: 'Robotics: Science and Systems (RSS)',
    badge: 'RSS',
    category: 'Vision & robotics',
    description: 'RSS two-column robotics conference template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[conference]{IEEEtran}',
  },
  {
    id: 'siggraph',
    name: 'ACM SIGGRAPH',
    badge: 'SIGGRAPH',
    category: 'Vision & robotics',
    description: 'ACM Transactions on Graphics (TOG) & SIGGRAPH conference format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf,acmtog]{acmart}',
  },

  // 6. Systems & security (13)
  {
    id: 'usenix-osdi',
    name: 'USENIX OSDI',
    badge: 'OSDI',
    category: 'Systems & security',
    description: 'Operating Systems Design and Implementation two-column format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper,twocolumn,10pt]{article}\\usepackage{usenix}',
  },
  {
    id: 'usenix-nsdi',
    name: 'USENIX NSDI',
    badge: 'NSDI',
    category: 'Systems & security',
    description: 'Networked Systems Design and Implementation template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper,twocolumn,10pt]{article}\\usepackage{usenix}',
  },
  {
    id: 'usenix-security',
    name: 'USENIX Security',
    badge: 'USENIX Sec',
    category: 'Systems & security',
    description: 'USENIX Security Symposium submission template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper,twocolumn,10pt]{article}\\usepackage{usenix}',
  },
  {
    id: 'usenix-fast',
    name: 'USENIX FAST',
    badge: 'FAST',
    category: 'Systems & security',
    description: 'Conference on File and Storage Technologies template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper,twocolumn,10pt]{article}\\usepackage{usenix}',
  },
  {
    id: 'usenix-atc',
    name: 'USENIX ATC',
    badge: 'ATC',
    category: 'Systems & security',
    description: 'USENIX Annual Technical Conference proceedings format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper,twocolumn,10pt]{article}\\usepackage{usenix}',
  },
  {
    id: 'acm-sosp',
    name: 'ACM SOSP',
    badge: 'SOSP',
    category: 'Systems & security',
    description: 'Symposium on Operating Systems Principles two-column format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigplan,10pt]{acmart}',
  },
  {
    id: 'acm-eurosys',
    name: 'ACM EuroSys',
    badge: 'EuroSys',
    category: 'Systems & security',
    description: 'European Conference on Computer Systems format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigplan,10pt]{acmart}',
  },
  {
    id: 'acm-sigcomm',
    name: 'ACM SIGCOMM',
    badge: 'SIGCOMM',
    category: 'Systems & security',
    description: 'Special Interest Group on Data Communication proceedings.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf,10pt]{acmart}',
  },
  {
    id: 'acm-ccs',
    name: 'ACM CCS',
    badge: 'CCS',
    category: 'Systems & security',
    description: 'ACM Conference on Computer and Communications Security.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf,anonymous,review]{acmart}',
  },
  {
    id: 'ieee-sp',
    name: 'IEEE S&P (Oakland)',
    badge: 'IEEE S&P',
    category: 'Systems & security',
    description: 'IEEE Symposium on Security and Privacy conference template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[conference,compsoc]{IEEEtran}',
  },
  {
    id: 'ndss',
    name: 'NDSS Symposium',
    badge: 'NDSS',
    category: 'Systems & security',
    description: 'Network and Distributed System Security Symposium.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[conference]{IEEEtran}',
  },
  {
    id: 'acm-asplos',
    name: 'ACM ASPLOS',
    badge: 'ASPLOS',
    category: 'Systems & security',
    description: 'Architectural Support for Programming Languages and Operating Systems.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigplan,10pt]{acmart}',
  },
  {
    id: 'isca-micro',
    name: 'ISCA / MICRO / HPCA',
    badge: 'Arch',
    category: 'Systems & security',
    description: 'Computer Architecture symposium template (ISCA/MICRO/HPCA).',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },

  // 7. Data, HCI & web (14)
  {
    id: 'acm-chi',
    name: 'ACM CHI',
    badge: 'CHI',
    category: 'Data, HCI & web',
    description: 'Conference on Human Factors in Computing Systems manuscript.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[manuscript,review,anonymous]{acmart}',
  },
  {
    id: 'acm-uist',
    name: 'ACM UIST',
    badge: 'UIST',
    category: 'Data, HCI & web',
    description: 'Symposium on User Interface Software and Technology.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'acm-cscw',
    name: 'ACM CSCW (PACM HCI)',
    badge: 'CSCW',
    category: 'Data, HCI & web',
    description: 'Computer-Supported Cooperative Work and Social Computing.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall]{acmart}',
  },
  {
    id: 'acm-ubicomp',
    name: 'ACM UbiComp / IMWUT',
    badge: 'IMWUT',
    category: 'Data, HCI & web',
    description: 'Interactive, Mobile, Wearable and Ubiquitous Technologies.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall]{acmart}',
  },
  {
    id: 'acm-sigmod',
    name: 'ACM SIGMOD',
    badge: 'SIGMOD',
    category: 'Data, HCI & web',
    description: 'Management of Data conference proceedings (PACMMOD).',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'vldb',
    name: 'VLDB (PVLDB)',
    badge: 'VLDB',
    category: 'Data, HCI & web',
    description: 'Proceedings of the VLDB Endowment two-column template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass{vldb}',
  },
  {
    id: 'ieee-icde',
    name: 'IEEE ICDE',
    badge: 'ICDE',
    category: 'Data, HCI & web',
    description: 'IEEE International Conference on Data Engineering.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[conference]{IEEEtran}',
  },
  {
    id: 'acm-kdd',
    name: 'ACM KDD',
    badge: 'KDD',
    category: 'Data, HCI & web',
    description: 'Knowledge Discovery and Data Mining two-column proceedings.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'acm-www',
    name: 'ACM Web Conference (WWW)',
    badge: 'WWW',
    category: 'Data, HCI & web',
    description: 'The Web Conference two-column proceedings template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'acm-sigir',
    name: 'ACM SIGIR',
    badge: 'SIGIR',
    category: 'Data, HCI & web',
    description: 'Research and Development in Information Retrieval.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf,natbib=true]{acmart}',
  },
  {
    id: 'acm-wsdm',
    name: 'ACM WSDM',
    badge: 'WSDM',
    category: 'Data, HCI & web',
    description: 'Web Search and Data Mining conference template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'acm-cikm',
    name: 'ACM CIKM',
    badge: 'CIKM',
    category: 'Data, HCI & web',
    description: 'Conference on Information and Knowledge Management.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'acm-recsys',
    name: 'ACM RecSys',
    badge: 'RecSys',
    category: 'Data, HCI & web',
    description: 'ACM Conference on Recommender Systems.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'icwsm',
    name: 'AAAI ICWSM',
    badge: 'ICWSM',
    category: 'Data, HCI & web',
    description: 'International Conference on Web and Social Media.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[letterpaper]{article}\\usepackage{aaai2027}',
  },

  // 8. Software & programming languages (12)
  {
    id: 'acm-pldi',
    name: 'ACM PLDI',
    badge: 'PLDI',
    category: 'Software & programming languages',
    description: 'Programming Language Design and Implementation (PACMPL).',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall,screen,review]{acmart}',
  },
  {
    id: 'acm-popl',
    name: 'ACM POPL',
    badge: 'POPL',
    category: 'Software & programming languages',
    description: 'Principles of Programming Languages (PACMPL) layout.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall,screen,review]{acmart}',
  },
  {
    id: 'acm-oopsla',
    name: 'ACM OOPSLA',
    badge: 'OOPSLA',
    category: 'Software & programming languages',
    description: 'Object-Oriented Programming, Systems, Languages & Applications.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall,screen,review]{acmart}',
  },
  {
    id: 'acm-icfp',
    name: 'ACM ICFP',
    badge: 'ICFP',
    category: 'Software & programming languages',
    description: 'International Conference on Functional Programming.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall,screen,review]{acmart}',
  },
  {
    id: 'acm-icse',
    name: 'ACM/IEEE ICSE',
    badge: 'ICSE',
    category: 'Software & programming languages',
    description: 'International Conference on Software Engineering two-column format.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf,review,anonymous]{acmart}',
  },
  {
    id: 'acm-fse',
    name: 'ACM FSE',
    badge: 'FSE',
    category: 'Software & programming languages',
    description: 'Foundations of Software Engineering (PACMSE) layout.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[acmsmall,screen,review]{acmart}',
  },
  {
    id: 'ieee-ase',
    name: 'IEEE/ACM ASE',
    badge: 'ASE',
    category: 'Software & programming languages',
    description: 'Automated Software Engineering conference template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf,review]{acmart}',
  },
  {
    id: 'acm-issta',
    name: 'ACM ISSTA',
    badge: 'ISSTA',
    category: 'Software & programming languages',
    description: 'International Symposium on Software Testing and Analysis.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf,review]{acmart}',
  },
  {
    id: 'cav',
    name: 'CAV',
    badge: 'CAV',
    category: 'Software & programming languages',
    description: 'Computer Aided Verification LNCS template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[runningheads]{llncs}',
  },
  {
    id: 'tacas',
    name: 'TACAS',
    badge: 'TACAS',
    category: 'Software & programming languages',
    description: 'Tools and Algorithms for the Construction and Analysis of Systems.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[runningheads]{llncs}',
  },
  {
    id: 'esop',
    name: 'ESOP',
    badge: 'ESOP',
    category: 'Software & programming languages',
    description: 'European Symposium on Programming LNCS format.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[runningheads]{llncs}',
  },
  {
    id: 'ecoop',
    name: 'ECOOP (LIPIcs)',
    badge: 'ECOOP',
    category: 'Software & programming languages',
    description: 'European Conference on Object-Oriented Programming (LIPIcs).',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[a4paper,UKenglish,cleveref]{lipics-v2021}',
  },

  // 9. Theory & algorithms (10)
  {
    id: 'acm-stoc',
    name: 'ACM STOC',
    badge: 'STOC',
    category: 'Theory & algorithms',
    description: 'Symposium on Theory of Computing proceedings template.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'ieee-focs',
    name: 'IEEE FOCS',
    badge: 'FOCS',
    category: 'Theory & algorithms',
    description: 'Foundations of Computer Science conference layout.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[conference]{IEEEtran}',
  },
  {
    id: 'siam-soda',
    name: 'SIAM SODA',
    badge: 'SODA',
    category: 'Theory & algorithms',
    description: 'ACM-SIAM Symposium on Discrete Algorithms.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[twoside,leqno,twocolumn]{article}',
  },
  {
    id: 'icalp',
    name: 'ICALP (LIPIcs)',
    badge: 'ICALP',
    category: 'Theory & algorithms',
    description: 'International Colloquium on Automata, Languages, and Programming.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[a4paper,UKenglish]{lipics-v2021}',
  },
  {
    id: 'esa',
    name: 'ESA (LIPIcs)',
    badge: 'ESA',
    category: 'Theory & algorithms',
    description: 'European Symposium on Algorithms (LIPIcs).',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[a4paper,UKenglish]{lipics-v2021}',
  },
  {
    id: 'colt',
    name: 'COLT',
    badge: 'COLT',
    category: 'Theory & algorithms',
    description: 'Conference on Learning Theory (JMLR W&CP) template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[anon,12pt]{colt2026}',
  },
  {
    id: 'itcs',
    name: 'ITCS (LIPIcs)',
    badge: 'ITCS',
    category: 'Theory & algorithms',
    description: 'Innovations in Theoretical Computer Science.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[a4paper,UKenglish]{lipics-v2021}',
  },
  {
    id: 'lics',
    name: 'ACM/IEEE LICS',
    badge: 'LICS',
    category: 'Theory & algorithms',
    description: 'Logic in Computer Science two-column layout.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'podc',
    name: 'ACM PODC',
    badge: 'PODC',
    category: 'Theory & algorithms',
    description: 'Principles of Distributed Computing proceedings.',
    format: 'latex',
    columns: 2,
    documentClass: '\\documentclass[sigconf]{acmart}',
  },
  {
    id: 'iacr-crypto',
    name: 'IACR CRYPTO / EUROCRYPT',
    badge: 'IACR',
    category: 'Theory & algorithms',
    description: 'International Association for Cryptologic Research LNCS template.',
    format: 'latex',
    columns: 1,
    documentClass: '\\documentclass[runningheads]{llncs}',
  },

  // 10. Markdown (6)
  {
    id: 'markdown-paper',
    name: 'Markdown Research Note',
    badge: 'Markdown',
    category: 'Markdown',
    description: 'Structured Markdown research memo with KaTeX math and citations.',
    format: 'markdown',
    columns: 1,
    documentClass: 'markdown-article',
  },
  {
    id: 'markdown-slides',
    name: 'Markdown Slide Deck',
    badge: 'Slides',
    category: 'Markdown',
    description: 'Presentation slide deck authored in Markdown with speaker notes.',
    format: 'slides',
    columns: 1,
    documentClass: 'markdown-slides',
  },
  {
    id: 'markdown-literature-review',
    name: 'Literature Review Matrix',
    badge: 'Markdown',
    category: 'Markdown',
    description: 'Comparative literature synthesis note with structured tables and citations.',
    format: 'markdown',
    columns: 1,
    documentClass: 'markdown-review',
  },
  {
    id: 'markdown-lab-notebook',
    name: 'Experiment Lab Log',
    badge: 'Markdown',
    category: 'Markdown',
    description: 'Reproducible experiment log with hyperparameters, metrics, and equations.',
    format: 'markdown',
    columns: 1,
    documentClass: 'markdown-lab',
  },
  {
    id: 'markdown-grant-proposal',
    name: 'Grant Proposal Draft',
    badge: 'Markdown',
    category: 'Markdown',
    description: 'Research grant specific aims, methodology, and milestones draft.',
    format: 'markdown',
    columns: 1,
    documentClass: 'markdown-grant',
  },
  {
    id: 'markdown-rebuttal',
    name: 'Peer Review Rebuttal',
    badge: 'Markdown',
    category: 'Markdown',
    description: 'Point-by-point author response to reviewers R1, R2, and R3.',
    format: 'markdown',
    columns: 1,
    documentClass: 'markdown-rebuttal',
  },
];

export const DEFAULT_BIBTEX = `@article{vaswani2017attention,
  title={Attention Is All You Need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},
  journal={Advances in Neural Information Processing Systems (NeurIPS)},
  volume={30},
  pages={5998--6008},
  year={2017}
}

@article{knuth1984literate,
  title={Literate Programming},
  author={Knuth, Donald E.},
  journal={The Computer Journal},
  volume={27},
  number={2},
  pages={97--111},
  year={1984},
  publisher={Oxford University Press}
}

@inproceedings{lamport1994latex,
  title={LaTeX: A Document Preparation System},
  author={Lamport, Leslie},
  booktitle={Addison-Wesley Series},
  year={1994}
}
`;

export function getVenueTemplateById(id: string): VenueTemplate {
  return (
    VENUE_TEMPLATES.find((t) => t.id === id) ||
    VENUE_TEMPLATES[0]
  );
}

export function generateStarterFilesForTemplate(
  templateId: string,
  projectName: string,
  authorName = 'Researcher'
): Array<{
  path: string;
  name: string;
  folderPath: string;
  kind: string;
  content: string;
  isMain: boolean;
}> {
  const tmpl = getVenueTemplateById(templateId);

  if (tmpl.format === 'typst') {
    const typContent = `#set page(paper: "us-letter", margin: (x: 1.75in, y: 1.5in))
#set text(font: "New Computer Modern", size: 11pt)
#set heading(numbering: "1.")

#align(center)[
  #text(17pt, weight: "bold")[${projectName}]
  
  #v(0.6em)
  #text(11pt)[${authorName}] \\
  #text(10pt, style: "italic")[CorTeX Research Workspace]
]

#v(1em)
#block(inset: (x: 1.5em))[
  *Abstract.* Summarize the central research question, methodology, quantitative findings, and key takeaways of this study.
]

= Introduction
Introduce the problem domain and motivate why existing approaches leave an important gap @vaswani2017attention.

= Method
We formulate the objective over input space $cal(X)$ and parameter vector $theta in RR^d$:
$ cal(L)(theta) = 1/N sum_(i=1)^N ell(f_theta (x_i), y_i) + lambda norm(theta)_2^2 $

= Experimental Results
Present quantitative benchmarks and ablation studies comparing against strong baselines @knuth1984literate.

= Conclusion
Summarize the main contributions and outline future research directions.

#bibliography("refs.bib")
`;
    return [
      {
        path: 'main.typ',
        name: 'main.typ',
        folderPath: '',
        kind: 'typ',
        content: typContent,
        isMain: true,
      },
      {
        path: 'refs.bib',
        name: 'refs.bib',
        folderPath: '',
        kind: 'bib',
        content: DEFAULT_BIBTEX,
        isMain: false,
      },
    ];
  }

  if (tmpl.format === 'slides') {
    const slidesContent = `---
title: "${projectName}"
author: "${authorName}"
theme: "cortex-academic"
---

# ${projectName}

### ${authorName}
CorTeX Collaborative Research Workspace

Note: Welcome the audience and state the core research thesis in one sentence.

---

## 1. Research Motivation & Problem Statement

- Scientific writing often fragments across reference managers, LaTeX editors, and slide tools.
- Key challenge: maintaining **mathematical rigor** while iterating rapidly with coauthors.
- Prior foundational work demonstrates scalable attention mechanisms [@vaswani2017attention].

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V$$

Note: Emphasize how unified citation and equation workflows reduce context switching.

---

## 2. Proposed Architecture & Empirical Findings

| Configuration | Latency (ms) | Citation Accuracy | Coauthor Sync |
| :--- | :---: | :---: | :---: |
| Baseline Pipeline | 1,420 ms | 91.2% | Manual |
| **CorTeX Unified** | **42 ms** | **99.8%** | **Real-Time** |

Note: Walk through the table highlighting sub-50ms incremental preview updates.

---

## 3. Conclusion & Next Steps

1. Unified LaTeX, Typst, Markdown, and Slide authoring in one workspace.
2. Direct evidence grounding from the personal Research Library.
3. Propose-and-review AI edits where the researcher stays in full control.

Note: Conclude and open the floor for questions.
`;
    return [
      {
        path: 'slides.md',
        name: 'slides.md',
        folderPath: '',
        kind: 'slides',
        content: slidesContent,
        isMain: true,
      },
      {
        path: 'refs.bib',
        name: 'refs.bib',
        folderPath: '',
        kind: 'bib',
        content: DEFAULT_BIBTEX,
        isMain: false,
      },
    ];
  }

  if (tmpl.format === 'markdown') {
    const mdContent = `# ${projectName}

**Author:** ${authorName}  
**Template:** ${tmpl.name} (${tmpl.badge})

## Abstract
Summarize the research question, methodology, empirical results, and principal conclusions of this study [@vaswani2017attention].

## 1. Introduction
Academic writing benefits from tight feedback loops between literature reading, mathematical formulation, and prose refinement [@knuth1984literate].

Inline mass-energy equivalence $E = mc^2$ and the regularized empirical risk objective:

$$\\mathcal{J}(\\theta) = \\frac{1}{n}\\sum_{i=1}^{n} \\mathcal{L}\\big(f_\\theta(x_i), y_i\\big) + \\lambda \\|\\theta\\|_2^2$$

## 2. Methodology & Experimental Setup

| Model Variant | Parameters | Top-1 Accuracy (%) | Inference Time (ms) |
| :--- | :---: | :---: | :---: |
| Baseline Encoder | 110M | 84.6 | 18.4 |
| **Proposed Method** | **112M** | **89.3** | **14.1** |

- [x] Formulate theoretical convergence bound
- [x] Verify BibTeX citations against Research Library
- [ ] Run multi-seed sensitivity ablation

## 3. Discussion & Limitations
Discuss key findings, practical boundary conditions, and directions for future investigation [@lamport1994latex].
`;
    return [
      {
        path: 'memo.md',
        name: 'memo.md',
        folderPath: '',
        kind: 'md',
        content: mdContent,
        isMain: true,
      },
      {
        path: 'refs.bib',
        name: 'refs.bib',
        folderPath: '',
        kind: 'bib',
        content: DEFAULT_BIBTEX,
        isMain: false,
      },
    ];
  }

  // Default: LaTeX (.tex) tailored to the selected venue template
  const texContent = `% CorTeX Venue Template: ${tmpl.name} (${tmpl.badge})
% Category: ${tmpl.category} | Columns: ${tmpl.columns}
${tmpl.documentClass}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}

\\title{${projectName}}
\\author{${authorName} \\\\
  Department of Computer Science \\\\
  \\texttt{author@example.edu}}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
We present \\textbf{${projectName}}, a rigorous study formatted for \\emph{${tmpl.name}}. Summarize the core research problem, methodological innovations, quantitative improvements over prior baselines \\cite{vaswani2017attention}, and broader scientific impact.
\\end{abstract}

\\section{Introduction}
\label{sec:intro}
Introduce the fundamental research question and motivate why existing techniques face critical bottlenecks in scalability and precision \\cite{vaswani2017attention,knuth1984literate}. State the main contributions of this paper clearly:
\\begin{itemize}
  \\item \\textbf{Theoretical Formulation:} We establish a principled objective with provable stability guarantees.
  \\item \\textbf{System Architecture:} We design an efficient pipeline tailored for ${tmpl.badge} evaluation workloads.
  \\item \\textbf{Empirical Validation:} Extensive experiments demonstrate consistent gains across standard benchmarks \\cite{lamport1994latex}.
\\end{itemize}

\\section{Related Work}
\label{sec:related}
Prior studies in ${tmpl.category.toLowerCase()} have explored representation learning and structured optimization \\cite{vaswani2017attention}. In contrast to heuristic post-processing, our formulation directly optimizes the end-to-end objective.

\\section{Methodology}
\label{sec:method}
Let $\\mathcal{D} = \\{(x_i, y_i)\\}_{i=1}^{N}$ denote the observed dataset. We minimize the regularized empirical risk:
\\begin{equation}
  \\mathcal{L}(\\theta) = \\frac{1}{N} \\sum_{i=1}^{N} \\ell\\big(f_\\theta(x_i), y_i\\big) + \\frac{\\lambda}{2} \\|\\theta\\|_2^2
  \\label{eq:objective}
\\end{equation}
where $\\ell(\\cdot,\\cdot)$ denotes the task loss and $\\lambda > 0$ controls regularization strength.

\\section{Experimental Results}
\label{sec:results}
Table~\\ref{tab:main-results} compares our approach against baseline methods across primary evaluation metrics.

\\begin{table}[ht]
\\centering
\\caption{Quantitative comparison on the primary ${tmpl.badge} benchmark.}
\\label{tab:main-results}
\\begin{tabular}{lcc}
\\toprule
Method & Score ($\\uparrow$) & Latency (ms $\\downarrow$) \\\\
\\midrule
Standard Baseline \\cite{lamport1994latex} & 82.4 & 34.2 \\\\
Attention Variant \\cite{vaswani2017attention} & 87.9 & 21.8 \\\\
\\textbf{Ours (${projectName})} & \\textbf{92.6} & \\textbf{14.5} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Limitations and Conclusion}
\label{sec:conclusion}
While our method achieves strong empirical improvements, future work should investigate domain shift under low-resource regimes. In summary, we have demonstrated an effective framework for ${projectName}.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}
`;

  return [
    {
      path: 'main.tex',
      name: 'main.tex',
      folderPath: '',
      kind: 'tex',
      content: texContent,
      isMain: true,
    },
    {
      path: 'refs.bib',
      name: 'refs.bib',
      folderPath: '',
      kind: 'bib',
      content: DEFAULT_BIBTEX,
      isMain: false,
    },
  ];
}
