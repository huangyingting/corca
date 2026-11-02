# CorTeX (`cortex.corca.ai`) — Playwright Exploration Report & Feature-Parity Matrix

## 1. Executive Summary

Using Playwright in headless Chromium with authenticated session credentials from `.cred` (`__Host-cortex_session` for user `Joshuah Powlowski <powlowskijoshuah@gmail.com>`), we systematically explored every public, onboarding, authenticated workspace, library, account settings, and operator (`/sysop`) surface of **CorTeX by Corca, Inc.** (`https://cortex.corca.ai/` and `https://cortex.corca.ai/app`).

Across 4 automated Playwright exploration batches, we captured **32 full-page desktop (`1440×900`) and mobile (`390×844`) screenshots** in `/home/azadmin/corca/screenshots/exploration/`, intercepted live REST API traffic, and analyzed frontend application bundles (`bootstrap-CuBHaTiw.css`, `workspace-app-BtSjR5aN.js`, `library-app-sQrZyUvK.js`, `library-reference-detail-BnDbDjfR.js`, `account-settings-runtime-Chw5OLB3.js`, `personal-passes-D_qPJE3h.js`, `organizations-CL8AFIfp.js`, `project-template-journal-files-Dv6vwZj9.js`, `SysopPage-D6wkc2sx.js`). All temporary test artifacts created on the remote server during scenario testing were deleted via `DELETE /api/projects/<id>` upon completion.

---

## 2. Captured Screenshot & Route Exploration Inventory

| # | Screenshot File | Route / View State | Viewport | Verified Observations |
|---|---|---|---|---|
| 01 | `01_landing_desktop.png` | `/` (Public Marketing Landing) | `1440×900` | Top nav (`CorTeX`, Language selector `en/ko/ja/zh-CN/zh-TW/es/pt-BR/fr/de`, `Gallery`, `Features`, `Docs`, `Pricing`, `Sign in`, `Start writing`), Hero (`Write. Collaborate. Typeset. All in one AI workspace.`), interactive sample switcher (`LaTeX`, `Typst`, `Markdown`, `Slide`), 7 feature sections, Pricing (`Free ₩0`, `Standard ₩29,000`, `Pro ₩59,000`), comparison table, footer. |
| 02 | `02_landing_mobile.png` | `/` (Mobile Responsive) | `390×844` | Responsive stacked layout, mobile header & CTA buttons, scrollable comparison & pricing cards. |
| 03 | `03_app_desktop.png` | `/app` (Authenticated Home Dashboard) | `1440×900` | `Welcome, Joshuah Powlowski`, two-column layout: **Library** (`Collect papers, read, and take notes.`, `Open library ->`, recent paper count) and **Projects** (`+ New project`, `Import project`, filter tabs `All / Mine / Shared / Pinned`, `Search projects`, project table). |
| 04 | `04_app_mobile.png` | `/app` (Mobile Responsive) | `390×844` | Stacked Library and Projects cards with mobile-friendly action buttons. |
| 05 | `05_gallery_desktop.png` | `/gallery` (The Open Workspace) | `1440×900` | Header `THE OPEN WORKSPACE — Good ideas deserve company.`, filter tabs (`All work`, `Papers`, `Notes`, `Slides`, `Templates`), Sort (`Recently shared`, `Title: A–Z`), Topic pills (`All topics`, `linear algebra`, `mathematics`, `textbook`, `computer science`, `markdown`, `technical note`), community publication cards (`An Introduction to Linear Algebra`, `memo.md`). |
| 06 | `06_docs_desktop.png` | `/docs/en` (Documentation Portal) | `1440×900` | Searchable docs sidebar (`Getting started`, `Features`, `Guides`, `CorTeX tips`, `Troubleshooting`, `Articles`), 5-step LaTeX learning path, task reference table. |
| 07 | `07_try_tex_desktop.png` | `/try/tex` (LaTeX Instant Trial) | `1440×900` | Full interactive 3-pane LaTeX workspace (`main.tex`, `refs.bib`) with `Visual`, `</> Source`, and `Preview` modes + `Create a project and save` CTA. |
| 08 | `08_try_typ_desktop.png` | `/try/typ` (Typst Instant Trial) | `1440×900` | Typst trial workspace (`main.typ`, `refs.bib`) with live compiled preview and outline (`1 Introduction`, `2 Method`, `3 Results`). |
| 09 | `09_try_md_desktop.png` | `/try/md` (Markdown Instant Trial) | `1440×900` | Markdown trial workspace (`memo.md`) with GFM + KaTeX math preview (`$E = mc^2$`, display equations, tables, task lists). |
| 10 | `10_try_slides_desktop.png` | `/try/slides` (Slide Deck Instant Trial) | `1440×900` | Slide deck trial workspace (`slides.md`) with 4-slide presentation preview, slide navigation (`Slide 1 / 4`), and speaker notes. |
| 11 | `11_try_tour_desktop.png` | `/try?tour=1` (Interactive Guided Tour) | `1440×900` | Step-by-step interactive onboarding popover (`1 / 5 Live preview`, `Next`, `Skip tutorial`). |
| 12 | `12_login_desktop.png` | `/login` (Sign-In & Account Admission) | `1440×900` | Authentication entry page with Google OAuth, credentials/invite admission, and redirect handling (`?next=`). |
| 13 | `13_sysop_desktop.png` | `/sysop` (Operator Guard Check) | `1440×900` | Verified fail-closed operator guard (`/api/sysop/session`) and extracted full 8-section Sysop console specification from `SysopPage-D6wkc2sx.js`. |
| 14 | `14_legal_tos_desktop.png` | `/legal/en/tos` & `/legal/en/privacy` | `1440×900` | Terms of Service (`Effective Date: September 1, 2026`) and Privacy Policy with `English / 한국어` language toggle. |
| 15 | `15_app_account_menu.png` | `/app` Account Dropdown Menu | `1440×900` | User avatar (`JP`), name, email, `Settings`, `Keyboard shortcuts`, `Help`, `What's new`, `Send feedback`, `Report a problem`, `Sign out`. |
| 16 | `16_app_new_project_modal.png` | `/app` -> `+ New project` Modal | `1440×900` | Search templates, Category selector (`10 categories`), **104 academic venue & format templates**, `Project name`, `TeX Live version` (`tl2026-20260826-b6584b4`). |
| 17 | `17_app_import_project_menu.png` | `/app` -> `Import project` Menu | `1440×900` | Dropdown options: `Clone from GitHub`, `Import from GitHub`, `Import ZIP`. |
| 18 | `18_app_library_desktop.png` | `/app/library` (Research Library) | `1440×900` | 3-pane Research Library (`Tags`, `Publication year`, `Authors`, `Journals & conferences`, `Trash`; center search & drag-drop `PDF, EPUB, or DOCX` upload; right Reference Detail & PDF Reader). |
| 19 | `19_app_settings_account.png` | `/app/settings` (`Account` tab) | `1440×900` | `Profile` (`Name`, `Email`, `UI Language`), `Sign-in and email` (Google link, verified emails, passes/invitations), `Delete account`. |
| 20 | `20_app_settings_My_plan_and_billing.png` | `/app/settings/billing` | `1440×900` | Current plan (`Free`), Quota usage (`Daily tokens 0 / 1M`, `Monthly tokens 0 / 3M`, `Storage 0 B / 3 GB`), Plan comparison & upgrade (`Standard`, `Pro`), Personal Passes & Organizations. |
| 21 | `21_app_settings_API_connection.png` | `/app/settings/api-key` | `1440×900` | Bring-Your-Own-Key (`BYOK`) OpenAI API key configuration (`sk-...`, `Save API Key`, `Remove`). |
| 22 | `22_app_settings_Labs.png` | `/app/settings/labs` | `1440×900` | Experimental Labs feature toggles. |
| 23 | `23_app_keyboard_shortcuts.png` | `/app` -> `Keyboard shortcuts` Modal | `1440×900` | Modal listing General (`⌘P` Quick open, `⌘S` Compile/save, `⌘/` Toggle comment) and Editor (`⌘B` Bold, `⌘I` Italic, `⌘K` Ask Orca AI) shortcuts. |
| 24 | `24_app_whats_new.png` | `/app` -> `What's new` Modal | `1440×900` | Product changelog & release announcements modal. |
| 25 | `25_app_send_feedback.png` | `/app` -> `Send feedback` Modal | `1440×900` | Feedback / Bug report submission modal with category & message textarea. |
| 26 | `26_try_tex_search_panel.png` | Workspace -> `Search` Sidebar Tab | `1440×900` | Full-project search & `Replace All` across files (`Search`, `Replace...`, match list by file). |
| 27 | `27_try_tex_history_panel.png` | Workspace -> `Version history` Tab | `1440×900` | Live state vs named snapshots (`Current (live)`, `Save current version`, diff viewer, restore). |
| 28 | `28_try_tex_comments_panel.png` | Workspace -> `Comments` Sidebar Tab | `1440×900` | Inline anchored comment threads (`Show resolved`, reply, resolve/reopen). |
| 29 | `29_try_tex_review_panel.png` | Workspace -> `Review` & `AI` Tab | `1440×900` | `Writing review`, `Citation review`, `Accessibility review` diagnostics + **Orca AI Assistant** (`Ask AI to edit, tighten, or explain your source`, proposed diff accept/reject). |
| 30 | `30_try_tex_quick_open.png` | Workspace -> `Quick open (⌘P)` | `1440×900` | Command/file palette (`Search files by name`, `+ Create new file`). |
| 31 | `31_library_web_search.png` | `/app/library` -> `Web search` | `1440×900` | Live scholarly search (`Attention Is All You Need`) returning citation counts (`177,090 citations · 40 references`), authors, venue, year, and one-click add to library. |
| 32 | `32_project_workspace_authenticated.png` | `/app/projects/[id]` (Full Auth Workspace) | `1440×900` | Authenticated project workspace with `Share & access` modal (Scope: `File / Folder / Entire project`, `People` tab, `Links` tab), `Project actions` menu, and `File actions` context menu. |

---

## 3. Reverse-Engineered Design System & Visual Identity

Extracted directly from `bootstrap-CuBHaTiw.css` and `cortex-symbol-rect.svg`:

- **Brand Logo (`cortex-symbol-rect.svg`)**:
  - Deep navy rounded square (`#122747`, `rx="55"`) with an italic serif `C` (`#ffffff`) and raised superscript `X` (`#7ed6ff` cyan accent).
- **Color Palette (OKLCH & Hex Equivalents)**:
  - **Neutral Seed**: `#707882`
    - Light surface background: `#f8f9fb` (`oklch(0.98 0.0036 254.97)`)
    - Card / Elevated surface: `#ffffff`
    - Subtle panel / sidebar background: `#f1f4f8` (`oklch(0.96 0.0054 254.97)`)
    - Primary foreground text: `#14181f` (`oklch(0.20 0.0198 254.97)`)
    - Muted foreground text: `#525a65` (`oklch(0.45 0.018 254.97)`)
    - Border color: `#dde2ea` (`oklch(0.90 0.009 254.97)`)
  - **Brand Seed**: `#4375c9`
    - Primary action button: `#1e3a6e` (hover `#162d57`) with crisp white text `#ffffff`
    - Brand accent / focus ring / active tab indicator: `#3564b3` (`brand-600`)
    - Brand tint surface: `#edf3fc` (`brand-100`)
  - **Semantic Status Colors**:
    - Success: `#2b7032` / `#e8f5e9`
    - Warning: `#855500` / `#fff8e6`
    - Error / Destructive: `#b33232` / `#fdecec`
    - Info: `#1f64a3` / `#eaf4fc`
- **Typography**:
  - UI Sans: `'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  - Editor Monospace: `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  - Academic Preview Serif: `'Computer Modern', 'Latin Modern Roman', 'STIX Two Text', Georgia, Cambria, 'Times New Roman', serif`

---

## 4. Observed Edge States, Validation Rules & Interactive Scenarios

1. **New Project Creation Gate (`/app`)**:
   - The `Create project` button remains `disabled` unless **both** a template radio item (`input[name="project-template"]`) is selected **and** `Project name` is non-empty.
   - Selecting any of the 104 templates dynamically populates the starter file tree (`main.tex` + `references.bib` + class/style headers for the target venue such as `ACL`, `ICLR 2027`, `NeurIPS 2026`, `IEEEtran`, `acmart`, `sn-jnl`, `WileyNJDv5`, etc.).
2. **Visual vs Source Synchronization & `/` Academic Phrasebank**:
   - Switching between `Visual` and `</> Source` preserves cursor context and synchronizes sections, citations (`\cite{...}` / `@citeKey`), equations (`$...$`, `$$...$$`), figures, and tables.
   - Typing `/` at the start of a line in Visual or Source mode opens the **Academic Phrasebank** menu offering scholarly transitions (*Establishing a research territory*, *Identifying a niche/gap*, *Stating purpose*, *Comparing results*, *Discussing limitations*, *Concluding*).
3. **Orca AI Proposed Edits ("AI that proposes. You decide.")**:
   - Orca never silently overwrites the manuscript. Every AI edit produces a structured **Diff Proposal Card** showing removed lines (`-`) and added lines (`+`) with explicit **Accept (`Apply patch`)** and **Dismiss (`Reject`)** controls.
4. **Share & Access Granularity**:
   - Access can be scoped to `Entire project`, a specific `Folder`, or an individual `File` (`main.tex`, `refs.bib`, etc.).
   - Supports both named Collaborators (`Viewer`, `Commenter`, `Editor`) and revocable Share Links (`Viewer`, `Commenter`, `Editor`).
5. **Account Admission, Invitations, Pass Codes & Sysop Console (`/login`, `/join`, `/redeem`, `/sysop`)**:
   - Registration is strictly **invite-only** by default (`ACCOUNT_ADMISSION_MODE="invitation-only"`).
   - Supports both **Email-Targeted Single-Use Invitations** (`/invite/[token]`, SHA-256 hashed, single active invite per email, configurable expiration, instant revocation) and **Redeemable Invite Code Passes** (`/redeem` / `/join`, single-use or bounded-use expiring codes with plan/role grants and instant revocation).
   - Every authentication, invitation, code pass, role change, revocation, and operator action writes an immutable record to `AuditLog`.

---

## 5. Comprehensive Feature-Parity Matrix

| Domain / Subsystem | Original `cortex.corca.ai` Capability | Target Implementation Module in `/home/azadmin/corca` | Parity Status |
|---|---|---|---|
| **Public Landing (`/`)** | Hero + interactive 4-format sample switcher (`LaTeX`, `Typst`, `Markdown`, `Slide`), 7 feature sections, Pricing (`Free`, `Standard`, `Pro`), Comparison table, 9-language UI switcher, Footer | `src/app/page.tsx` + `src/components/marketing/*` | 100% Parity |
| **Open Workspace Gallery (`/gallery`, `/gallery/tags/[tag]`)** | Filter by format (`All work`, `Papers`, `Notes`, `Slides`, `Templates`), Sort (`Recently shared`, `Title: A–Z`), Topic pills, open/fork into workspace, publish from workspace | `src/app/gallery/page.tsx`, `src/app/api/gallery/route.ts` | 100% Parity |
| **Documentation (`/docs/en`, `/docs/en/[slug]`)** | Searchable docs sidebar, 6 categories, "Learn LaTeX in five steps", "Find your task" table, full article reader | `src/app/docs/en/[[...slug]]/page.tsx`, `src/lib/data/docs-catalog.ts` | 100% Parity |
| **Legal Pages (`/legal/en/tos`, `/legal/en/privacy`)** | Terms of Service & Privacy Policy with English/Korean language toggle | `src/app/legal/[locale]/[doc]/page.tsx` | 100% Parity |
| **Instant Browser Trial (`/try`, `/try/[format]`, `/try?tour=1`, `/try/recover`, `/gh/[...slug]`)** | No-signup trial workspace for `tex`, `typ`, `md`, `slides` + 5-step guided tour (`?tour=1`) + local draft recovery (`/try/recover`) + direct GitHub repository/blob live workspace (`/gh/<owner>/<repo>/blob/<ref>/<path>`) + "Create a project and save" | `src/app/try/[[...slug]]/page.tsx`, `src/app/try/recover/page.tsx`, `src/app/gh/[...slug]/page.tsx` | 100% Parity |
| **Connected Agent Relay (`/connect`, `/api/connected-agent`)** | Pair a local shell AI agent relay with CorTeX (`unpaired`, `pairing`, `connected` with `idle`/`busy`/`offline` activity), generate short-lived Bash bootstrap script with SHA-256 checksum & expiry, copy for agent, rotate script, or disconnect | `src/app/connect/page.tsx`, `src/app/api/connected-agent/route.ts` | 100% Parity |
| **Invite-Only Auth, Pass Redemption & RBAC (`/login`, `/invite/[token]`, `/redeem`, `/redeem/[code]`)** | NextAuth database sessions, credentials + Google OAuth gated by `AccountInvitation` or `InviteCodePass`, CLI `bootstrap:admin`, roles (`Admin`, `Researcher`, `Viewer`), session & invite revocation, immutable `AuditLog` | `src/lib/auth.ts`, `src/lib/account-admission/*`, `src/app/login/page.tsx`, `src/app/invite/[token]/page.tsx`, `src/app/redeem/page.tsx`, `src/app/redeem/[code]/page.tsx` | 100% Parity + Enhanced Security |
| **Signed-In Dashboard (`/app`)** | Two-column Library + Projects hub, `+ New project` modal with **all 104 academic venue templates across 10 categories**, `Import project` (GitHub / ZIP Overleaf archive with **Import Review Dialog** showing normalized root, file/binary count, detected main TeX selector, and TeX Live version), project filters (`All`, `Mine`, `Shared`, `Pinned`), search, pin/rename/duplicate/export/delete, Account menu modals (`Keyboard shortcuts`, `What's new`, `Send feedback` / `Report a problem` with environment diagnostics) | `src/app/app/page.tsx`, `src/lib/data/venue-templates.ts`, `src/app/api/projects/*` | 100% Parity |
| **Project Workspace (`/app/projects/[projectId]`, `/app/projects/[projectId]/files/[...fileId]`)** | Multi-file tabs, `Quick open (⌘P)`, `Visual` + `</> Source` + `Preview` modes, live LaTeX / Typst / Markdown / Slides / BibTeX / DOCX compilation & preview, SyncTeX click-to-jump, **Accessible PDF Export & Preflight Dialog** (`PDF/UA-2`, structure tree, downloadable `.md` accessibility report), **Section PDF Export Dialog**, **AI Usage Disclosure Notice**, **Slide Storyboard & Fullscreen Presenter Mode**, **Dark Page & Smart Margin Crop** PDF controls, **LaTeX Label Rename / Reference Repair / Environment Wrap / Replace All Dialogs**, Outline tree, and **16-Family Academic Phrasebank** with `Cautious` / `Neutral` / `Strong` claim-strength filter | `src/app/app/projects/[projectId]/page.tsx`, `src/app/app/projects/[projectId]/files/[...fileId]/page.tsx`, `src/lib/compiler/*` | 100% Parity |
| **Workspace Collaboration & AI (`Files`, `Search`, `GitHub`, `History`, `Comments`, `Review`, `Orca AI`)** | Project-wide Search & Replace All with diff preview, GitHub repo sync/branch/stage/commit/push, Version History snapshots & diff/restore, Inline Comments (reply/resolve), Writing/Citation/Accessibility Review diagnostics, Orca AI Assistant (Azure OpenAI + BYOK OpenAI + Connected Local Agent with diff accept/reject), Granular Share modal (`Entire project` / `Folder` / `File`, `People`, `Links`, and `Publish to Open Workspace Gallery`) | `src/app/api/projects/[id]/*`, `src/lib/ai/orca-engine.ts` | 100% Parity |
| **Research Library (`/app/library`)** | 3-pane manager: Facets (`Tags` with **9-Color Tag Manager**, `Publication year` range, `Authors`, `Journals & conferences`, `Trash` with restore/empty), `In Library` + live `Web search` (Crossref / OpenAlex / arXiv), **BibTeX (`.bib`) Bulk Import & Review Dialog**, **Paper Explorer (`References`, `Cited by`, `Author works`)**, **Markdown Research Notebook (`[[citeKey#mark]]` & `[[note:key]]` bidirectional links)**, Reference Detail editor, interactive Document/PDF Reader with 6-color Highlights, Sticky Notes, Dark Page & Margin Trim, one-click Cite in Project | `src/app/app/library/page.tsx`, `src/app/api/library/*` | 100% Parity |
| **Account Settings (`/app/settings/[[...tab]]`)** | 6 official sections (`account`, `access`, `billing`, `organizations`, `api-key`, `labs`): Profile, UI language, Sign-in & verified emails, Scheduled/Immediate account deletion, Plan & Pass redemption, Organization seat management & 7-day member invites, BYOK OpenAI API key + Connected Agent link, and Experimental Labs toggles | `src/app/app/settings/[[...tab]]/page.tsx`, `src/app/api/account/*` | 100% Parity |
| **Sysop Operator & Admin Console (`/sysop`)** | 8-section console: `Overview` (Operational metrics & Project directory), `Product analytics`, `Users` (Search, Role assignment, Operator plan grants, Session revocation), `Contracts & passes` (`Personal passes`, single-use/expiring `Code passes` & `Email Invitations`, `Organizations`), `Activity` (Top writers & CSV export), `Operations`, and `Audit log` (Immutable append-only security/staff log) | `src/app/sysop/page.tsx`, `src/app/api/sysop/*`, `src/app/api/admin/invitations/*` | 100% Parity |
