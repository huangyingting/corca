# Product Requirements Document (PRD) — CorTeX by Corca

## 1. Product Vision & Overview

**CorTeX** (`cortex.corca.ai`) is a collaborative AI-assisted academic writing and research workspace ("Write. Collaborate. Typeset. All in one AI workspace.") built for researchers, faculty, students, and R&D teams. It unifies:
1. **Multi-Format Academic Authoring**: LaTeX (`.tex`), Typst (`.typ`), Markdown (`.md`), Slide Decks (`slides.md` / Beamer), BibTeX (`.bib`), and Word (`.docx`) in a single workspace with `Visual`, `</> Source`, and `Preview` modes.
2. **104 Official Academic Venue Templates**: Pre-configured templates across 10 scholarly categories (`General formats`, `Publisher formats`, `NLP conferences`, `AI & machine learning`, `Vision & robotics`, `Systems & security`, `Data, HCI & web`, `Software & programming languages`, `Theory & algorithms`, `Markdown`).
3. **Personal Research Library (`/app/library`)**: Scholarly paper discovery (`In Library` + live `Web search`), PDF/EPUB/DOCX ingestion, faceted filtering (tags, year, authors, journals/conferences), interactive PDF/document reading with highlights and sticky notes, and one-click BibTeX citation into active manuscripts.
4. **"Orca" AI Coauthoring & Academic Review**: AI assistant that proposes diff patches (`Accept` / `Dismiss`), `/` academic phrasebank transitions, and automated Writing, Citation, and Accessibility review diagnostics.
5. **Enterprise-Grade Invite-Only Security, RBAC & Sysop Governance (`/sysop`)**: Fail-closed invite-only registration with single-use/expiring email invitations (`AccountInvitation`) and shareable code passes (`InviteCodePass`), role-based access control (`Admin`, `Researcher`, `Viewer`), immediate session/access revocation, and append-only audit logging (`AuditLog`).

---

## 2. Target Personas & Roles

| Persona / Role | System Role (`User.role`) | Key Responsibilities & Permissions |
|---|---|---|
| **System Operator / Administrator** | `Admin` | Manages `/sysop` console, issues/rotates/revokes single-use email invitations and expiring code passes, manages organizations & seat contracts, assigns user roles & operator plan grants, revokes sessions, inspects and exports immutable audit logs. |
| **Principal Investigator / Researcher** | `Researcher` | Creates and imports projects from 104 venue templates or GitHub/ZIP, curates papers in `/app/library`, writes manuscripts in Visual/Source modes, uses Orca AI & review tools, manages version history, and invites coauthors (`Editor`, `Commenter`, `Viewer`). |
| **Collaborator / Reviewer / Student** | `Researcher` or `Viewer` | Reads shared manuscripts, leaves anchored inline comments, proposes edits (if granted `EDITOR` on project), or views published works in `/gallery`. |
| **Prospective / Anonymous Visitor** | Unauthenticated | Explores `/`, `/gallery`, `/docs/en`, `/legal/*`, and tests the live browser workspace at `/try/tex`, `/try/typ`, `/try/md`, `/try/slides`, and `/try?tour=1`. Cannot create an account without a valid single-use/expiring invitation link or code pass. |

---

## 3. Detailed Functional Requirements

### 3.1 Public Marketing, Open Workspace Gallery, Docs & Instant Trial
- **FR-PUB-01 (Landing Page `/`)**:
  - Top navigation bar with CorTeX logo, 9-locale selector (`English`, `한국어`, `日本語`, `简体中文`, `繁體中文`, `Español`, `Português (Brasil)`, `Français`, `Deutsch`), links (`Gallery`, `Features`, `Docs`, `Pricing`), `Sign in`, and `Start writing`.
  - Hero section with interactive 4-format sample switcher (`LaTeX`, `Typst`, `Markdown`, `Slide`) rendering an interactive preview of each format and a `Try now` button.
  - All 7 canonical feature sections (`01 Fast, live LaTeX`, `02 LaTeX, Typst, Markdown, and slides. Together.`, `03 AI that proposes. You decide.`, `Read a paper. Bring its evidence into your draft.`, `Real-time coauthoring`, `Template gallery`, `Version history`).
  - Pricing cards (`Free ₩0`, `Standard ₩29,000`, `Pro ₩59,000`) and full feature comparison table (`CorTeX · Free` vs `Other service · Free`).
- **FR-PUB-02 (Open Workspace Gallery `/gallery` & `/gallery/tags/[tag]`)**:
  - Filter tabs (`All work`, `Papers`, `Notes`, `Slides`, `Templates`), sort selector (`Recently shared`, `Title: A–Z`), and topic pills (`All topics`, `linear algebra`, `mathematics`, `textbook`, `computer science`, `markdown`, `technical note`).
  - Users can open any shared work in a read-only preview or fork/copy it into `/try` or their authenticated `/app` workspace. Authenticated users can also publish a project snapshot to `/gallery`.
- **FR-PUB-03 (Documentation Portal `/docs/en` & `/docs/en/[slug]`)**:
  - Instant client/server search across all documentation articles.
  - Sidebar navigation across `Getting started`, `Features`, `Guides`, `CorTeX tips`, `Troubleshooting`, and `Articles`.
  - Interactive links from "Learn LaTeX in five steps" and "Find your task" table to full guide pages.
- **FR-PUB-04 (Instant Browser Trial `/try`, `/try/[format]`, `/try?tour=1`)**:
  - Works without authentication using browser storage + ephemeral compile API for `tex`, `typ`, `md`, and `slides`.
  - When `?tour=1` is present, displays the 5-step guided onboarding tour (`1/5 Live preview`, `2/5 Visual & Source editing`, `3/5 Citations & outline`, `4/5 AI & review`, `5/5 Create a project and save`).

### 3.2 Invite-Only Authentication, Pass Redemption, RBAC & Audit Logging
- **FR-AUTH-01 (Zero Dummy/Demo Accounts)**:
  - The database starts clean without pre-seeded demo users or fake accounts.
  - The initial root `Admin` is provisioned exclusively via the host CLI command `npm run bootstrap:admin -- --email <email> --password-stdin`.
- **FR-AUTH-02 (Fail-Closed Invite-Only Registration)**:
  - Public uninvited registration is rejected with `403 invitation_required`.
  - Prospective users can register only by presenting either:
    1. A valid, non-expired, single-use **Email Invitation Token** (`/invite/[token]` or `/login?invite=...`), OR
    2. A valid, non-expired, unexhausted **Invite Code Pass** (`/redeem` or `/join?code=...`).
- **FR-AUTH-03 (Role Enforcement & Revocation)**:
  - System roles (`Admin`, `Researcher`, `Viewer`) and account status (`active`, `suspended`, `revoked`) are checked on every authenticated request.
  - Revoking an invitation, revoking a pass, or suspending a user takes effect immediately, invalidating active database sessions (`Session`) and recording an immutable `AuditLog` entry.

### 3.3 Signed-In Home Dashboard (`/app`)
- **FR-APP-01 (Two-Column Workspace Home)**:
  - Left column: **Library** summary card (`Collect papers, read, and take notes.`, `Open library ->`, paper count & recent papers list).
  - Right column: **Projects** manager (`+ New project`, `Import project` dropdown [`Clone from GitHub`, `Import from GitHub`, `Import ZIP`], filter tabs [`All`, `Mine`, `Shared`, `Pinned`], live search input, and project table showing `Project`, `Last edited`, `Contents`, `Access`, and `Actions`).
- **FR-APP-02 (104-Template New Project Modal)**:
  - Searchable, category-filtered modal with all **104 academic venue & document templates** across 10 categories, `Project name` input, and `TeX Live version` selector (`tl2026-20260826-b6584b4`).
  - `Create project` button is strictly disabled until both a template is selected and a project name is entered.
- **FR-APP-03 (Account Dropdown & Modals)**:
  - Top-right user avatar menu with `Settings`, `Keyboard shortcuts` modal, `Help` (`/docs/en`), `What's new` modal, `Send feedback` modal, `Report a problem` modal, `Sysop Console` (visible when `role === "Admin"`), and `Sign out`.

### 3.4 Project Authoring & Collaboration Workspace (`/app/projects/[projectId]`)
- **FR-WS-01 (Top Chrome, Tabs, Quick Open & Mode Switcher)**:
  - Multi-file tab bar, `Quick open (⌘P)` modal with file search and instant file creation, and mode toggles: `Visual`, `</> Source`, and `Preview`.
- **FR-WS-02 (Activity Bar & 6 Left Sidebar Panels)**:
  1. `Files`: Access status pill (`Private` / `Shared` -> opens Share modal), `Project actions` menu (`New file`, `New folder`, `Import file`, `Export ZIP`, `Download PDF`, `Share & access`, `TeX Live 2026`, `LaTeX engine: Auto`, `Main document`, `Version history`), hierarchical file tree with per-file context menu (`Download`, `Share & access`, `Rename`, `Duplicate`, `Main document`, `Move to new project…`, `Delete`), and live `OUTLINE` tree (`Introduction`, `Methods`, `Results`, etc.).
  2. `Search`: Project-wide regex/text search across all files with single-click jump and `Replace` / `Replace All`.
  3. `GitHub`: Connect repository URL & branch, view modified files, commit changes, and sync (push/pull) with version history.
  4. `Version history`: View `Current (live)` vs saved snapshots/milestones, create named versions, inspect line-by-line diffs, and restore any prior version.
  5. `Comments`: Create inline comment threads anchored to selected text or line ranges, reply to threads, resolve/reopen, and toggle `Show resolved`.
  6. `Review` & `AI` ("Orca"): Run Writing Review, Citation Review, and Accessibility Review diagnostics; chat with **Orca AI** to edit, tighten, translate, or explain sections with interactive **Accept / Dismiss diff patches**; trigger `/` academic phrasebank transitions in the editor.
- **FR-WS-03 (Granular Share & Access Modal + Open Gallery Publishing)**:
  - Scope selector (`Entire project`, specific `Folder`, or specific `File`).
  - `People` tab: Invite collaborator by email (`Viewer`, `Commenter`, `Editor`), update role, or revoke access.
  - `Links` tab: Create and revoke shareable links (`Viewer`, `Commenter`, `Editor`).
  - `Public Gallery` tab: Publish or unpublish the workspace to `/gallery` with custom topic tags.
- **FR-WS-04 (Advanced Export, Accessibility Preflight, Section Export & LaTeX Refactoring)**:
  - **Accessible PDF Export & Preflight (`data-ui="accessible-pdf-export-dialog"`)**: Two-stage preflight & structure inspection dialog checking `Fixes`, `Reviews`, and `Compatibility` rules (`PDF/UA-2`, figure alt text, heading hierarchy, MathML formulas) with downloadable Markdown accessibility review report (`-review.md`).
  - **Section PDF Export (`data-ui="section-export-dialog"`)**: Select individual sections (`\section`, `\subsection`) to compile and download as a standalone PDF with dangling-reference diagnostics.
  - **AI Usage Disclosure Notice**: Include or inspect `CorTeXAIDisclosure` metadata (`May contain AI-generated content`) for compliant scholarly export.
  - **LaTeX Refactoring Tools**: Rename `\label{...}` across all `\ref`/`\eqref`/`\autoref` usages (`labelRename`), repair unresolved citations/references (`latexReferenceRepair`), wrap selections in LaTeX environments (`latexWrap`), and run project-wide `Search & Replace All` with diff preview.
  - **16-Family Academic Phrasebank**: Filter scholarly phrase skeletons across 16 rhetorical families and 3 claim-strength levels (`Cautious`, `Neutral`, `Strong`) with epistemological constraint badges.
  - **Slide Storyboard & PDF Controls**: Reorder/toggle slides in the Storyboard grid, launch Fullscreen Presenter mode, and toggle `Dark page` or `Remove margins` (smart crop) in the PDF preview.

### 3.5 Personal Research Library (`/app/library`)
- **FR-LIB-01 (Faceted Navigation Sidebar & 9-Color Tag Manager)**:
  - Displays total paper count, hierarchical `Tags` (`No tags` + user tags with 9 color swatches: `Gray`, `Red`, `Orange`, `Gold`, `Green`, `Teal`, `Blue`, `Violet`, `Pink`), `Publication year` (`from`–`to` range + `Unknown year`), `Authors` search & checkboxes, `Journals & conferences` search & checkboxes, and `Trash` (restore, permanently delete, or empty trash).
- **FR-LIB-02 (In-Library Search, Live Scholarly Web Search, Paper Citation Graph & BibTeX Bulk Import)**:
  - Toggle between `In Library` search and `Web search` (live OpenAlex & Crossref paper search returning title, authors, year, venue, citation count, reference count, DOI/arXiv ID, abstract, and one-click `Add to library`).
  - **Paper Explorer**: Inspect any paper's `References`, `Cited by`, and `Papers by this author` graph and import related works directly.
  - **BibTeX (`.bib`) Import Review Dialog**: Upload or paste `.bib` files, preview parsed entries with selection checkboxes, and bulk-import into the library.
- **FR-LIB-03 (Reference Detail Editor, Markdown Research Notebook & Interactive Document Reader)**:
  - Edit title, citeKey, authors, year, journal/venue, DOI, arXiv ID, URL, abstract, notes, and colored tags.
  - **Markdown Research Notebook**: Author Markdown research notes with `[[citeKey#mark]]` and `[[note:key]]` bidirectional links and backlinks to saved PDF locations.
  - Copy BibTeX or click **Cite in project** to inject the entry into any project's `.bib` file.
  - Built-in PDF/Document Reader with zoom (`Fit width`, `Fit page`, `Remove margins`, `Dark page`), 6-color text highlights (`Yellow`, `Green`, `Blue`, `Pink`, `Purple`, `Orange`), and anchored sticky notes.

### 3.6 Account Settings (`/app/settings/*`) & Connected Agent Relay (`/connect`)
- **FR-SET-01 (`account`)**: Update profile name and UI language (`9 locales`), inspect connected sign-in methods and verified emails, change password, or request scheduled/immediate account deletion.
- **FR-SET-02 (`access` & `billing`)**: View active plan (`Free`, `Standard`, `Pro`), daily/monthly AI token & storage usage meters, redeem a personal/code pass (`/redeem` or `/redeem/[code]`), and compare plans.
- **FR-SET-03 (`organizations`)**: Manage organization seat capacity, search members, edit roles (`Owner`, `Admin`, `Member`), and send 7-day seat invitations.
- **FR-SET-04 (`api-key` & `/connect`)**: Save, verify, or remove a personal OpenAI API key (`BYOK`) or pair a **Connected Local Agent (`/connect`)** via a short-lived SHA-256 verified Bash bootstrap script (`unpaired`, `pairing`, `connected` with live `idle`/`busy`/`offline` status).
- **FR-SET-05 (`labs`)**: Toggle experimental workspace features (`vimMode`, `autoCompileOnIdle`, `synctexHighlight`, `darkPdfPreviewByDefault`).

### 3.7 System Operator Console (`/sysop`)
- **FR-SYS-01 (`Overview` & `Product analytics`)**: View real-time operational health metrics (users, projects, active passes, library references, AI usage), search all projects in the directory, and inspect product analytics events/goals.
- **FR-SYS-02 (`Users`)**: Search accounts by email/name, inspect usage/projects/sessions, change system role (`Admin`, `Researcher`, `Viewer`), grant/clear operator plan overrides (`Free`, `Standard`, `Pro`), suspend/reactivate accounts, and force-revoke active user sessions.
- **FR-SYS-03 (`Contracts & passes` — Invitations, Code Passes & Organizations)**:
  - **Email Invitations (`AccountInvitation`)**: Issue single-use expiring email invitation links with role & plan assignment, rotate tokens, or revoke pending invitations.
  - **Code Passes (`InviteCodePass`)**: Batch-issue single-use or bounded-use expiring invitation/pass codes (`Pass name`, `Role`, `Plan`, `Quantity`, `Duration days`, `Expires at`, `Reason`), copy codes/links, and revoke active/unredeemed codes.
  - **Personal Passes & Organizations**: Issue targeted personal passes and create/manage organization seat contracts.
- **FR-SYS-04 (`Activity`, `Operations` & `Audit log`)**:
  - Rank most active writers by version history and export CSV.
  - Inspect pending outbox/recovery operations.
  - Browse, filter, and export the immutable append-only `AuditLog`.
