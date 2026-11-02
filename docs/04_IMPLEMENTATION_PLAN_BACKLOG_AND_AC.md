# Implementation Plan, Task Backlog & Acceptance Criteria — CorTeX by Corca

## 1. Phased Implementation Plan

### Phase 1: Exploration & Architecture Specification (Completed)
- Systematic Playwright exploration of `https://cortex.corca.ai/` and `https://cortex.corca.ai/app` across 32 desktop and mobile states.
- Inspection of `../Arcade` reference implementation (`NextAuth` database sessions, `AccountInvitation`, `PasswordCredential`, CLI `bootstrap-admin.ts`, Prisma 7 dual SQLite/PostgreSQL setup, Azure OpenAI provider).
- Authoring of ADR, PRD, Technical Specification, Data Model, Implementation Plan, and Auth/RBAC/Audit specifications in `/home/azadmin/corca/docs/`.

### Phase 2: Project Scaffolding, Dual Prisma Schema & Invite-Only Auth Core
- Configure `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, and `prisma.config.ts`.
- Create `prisma/schema.prisma` (SQLite) and `prisma/schema.postgres.prisma` (PostgreSQL) and generate initial SQLite & PostgreSQL migrations.
- Implement `src/lib/prisma.ts`, `src/lib/account-admission/*` (`tokens.ts`, `passwords.ts`, `policy.ts`, `session.ts`, `invitations.ts`, `code-passes.ts`, `registration.ts`, `credentials.ts`, `social.ts`, `bootstrap.ts`, `audit.ts`), and `src/lib/auth.ts`.
- Implement CLI script `scripts/bootstrap-admin.ts` (`npm run bootstrap:admin`) with zero demo/dummy accounts.

### Phase 3: Domain Catalogs, Multi-Format Typesetting Compiler & Orca AI Engine
- Implement the **104 Academic Venue & Document Templates** catalog (`src/lib/data/venue-templates.ts`) across all 10 categories with authentic starter `.tex`, `.typ`, `.md`, `slides.md`, and `.bib` files.
- Implement the **Documentation Portal Catalog** (`src/lib/data/docs-catalog.ts`) and **Academic Phrasebank** (`src/lib/data/phrasebank.ts`).
- Implement the **Multi-Format Academic Typesetting & Compilation Engine** (`src/lib/compiler/compile-engine.ts`) supporting LaTeX, Typst, Markdown, Slides, BibTeX, and Word (`.docx`) with SyncTeX line mapping, citation resolution, outline extraction, and Writing/Citation/Accessibility review diagnostics.
- Implement the **Orca AI Assistant Engine** (`src/lib/ai/orca-engine.ts`) supporting Azure OpenAI (`AZURE_OPENAI_*`) + user BYOK OpenAI keys with structured diff proposals (`originalSnippet` -> `proposedSnippet`).

### Phase 4: Public Pages, Onboarding, Instant Browser Trial & Auth Flows
- Build `/` Landing Page with 9-language selector, interactive 4-format hero switcher (`LaTeX`, `Typst`, `Markdown`, `Slide`), 7 feature sections, pricing, comparison table, and footer.
- Build `/gallery` and `/gallery/tags/[tag]` Open Workspace with category tabs, sort selector, topic pills, preview modal, and fork-to-workspace action.
- Build `/docs/en` and `/docs/en/[[...slug]]` Documentation Portal with instant search, sidebar navigation, 5-step LaTeX guide, and task lookup table.
- Build `/legal/[locale]/[doc]` Terms of Service and Privacy Policy pages with English/Korean switcher.
- Build `/try`, `/try/[format]`, and `/try?tour=1` Instant Browser Trial workspace with the 5-step guided tour overlay.
- Build `/login`, `/invite/[token]`, `/redeem`, and `/join` authentication and invite-only registration pages.

### Phase 5: Authenticated Workspace (`/app`, `/app/projects/[id]`, `/app/library`, `/app/settings/*`) & `/sysop`
- Build `/app` Authenticated Home Dashboard with two-column Library & Projects layout, 104-template `+ New project` modal, `Import project` menu (GitHub / ZIP), project filters (`All`, `Mine`, `Shared`, `Pinned`), search, and Account menu modals (`Keyboard shortcuts`, `What's new`, `Send feedback`).
- Build `/app/projects/[projectId]` Full Collaborative Authoring Workspace (`Visual`, `</> Source`, and `Preview` modes; 6 sidebar tabs: `Files` + Outline, `Search` & Replace, `GitHub` sync, `Version history` & diff/restore, `Comments` threads, `Review` diagnostics + `Orca AI` assistant with accept/dismiss diff cards; `Quick open ⌘P`; `/` academic phrasebank; granular `Share & access` modal).
- Build `/app/library` 3-pane Research Library (Faceted sidebar: `Tags`, `Publication year`, `Authors`, `Journals & conferences`, `Trash`; center `In Library` + live scholarly `Web search` + PDF/EPUB/DOCX drag-and-drop upload + BibTeX/DOI import; right Reference Detail metadata editor + interactive PDF/Document Reader with Highlights & Sticky Notes + one-click `Cite in project`).
- Build `/app/settings/[[...tab]]` (`Account`, `My plan and billing`, `API connection`, `Labs`).
- Build `/sysop` System Operator Console (`Overview`, `Product analytics`, `Users` & Roles/Grants/Session Revocation, `Contracts & passes` [Email Invitations, Single-Use/Expiring Code Passes, Personal Passes, Organizations], `Activity` ranking & CSV export, `Operations`, and immutable `Audit log`).

### Phase 6: Automated Verification, Unit/Integration Tests & Playwright E2E Suite
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Execute unit & integration tests covering invite-only admission, single-use token & code pass consumption, expiration, revocation, RBAC enforcement, audit logging, and multi-format compilation.
- Execute comprehensive Playwright E2E tests against the running application verifying desktop & mobile layouts, zero console/page errors, CLI admin bootstrap, invite-only registration, project creation across venue templates, Visual/Source/Preview editing, Orca AI diff proposals, Research Library web search & annotations, and `/sysop` governance.

---

## 2. Structured Task Backlog

| ID | Epic | Task Title | Dependencies | Priority |
|---|---|---|---|---|
| `B-01` | Foundation | Configure Next.js 16, TypeScript, Tailwind CSS (OKLCH tokens), and Prisma 7 dual SQLite/PostgreSQL schemas | — | P0 |
| `B-02` | Security & Auth | Implement NextAuth database sessions, `PasswordCredential`, `AccountInvitation`, `InviteCodePass`, RBAC, revocation, and `AuditLog` | `B-01` | P0 |
| `B-03` | Security & Auth | Implement `scripts/bootstrap-admin.ts` CLI tool and verify zero demo/dummy accounts in DB | `B-02` | P0 |
| `B-04` | Core Engines | Build 104 Academic Venue Templates catalog, Docs catalog, Academic Phrasebank, and Multi-Format Compiler (`.tex`, `.typ`, `.md`, `slides.md`, `.bib`, `.docx`) | `B-01` | P0 |
| `B-05` | Core Engines | Build Orca AI Assistant (Azure OpenAI + BYOK OpenAI) & Writing/Citation/Accessibility Review engine | `B-04` | P0 |
| `B-06` | Public Routes | Implement `/`, `/gallery`, `/docs/en/*`, `/legal/*`, and `/try/*` (including `?tour=1` guided tour) | `B-04` | P0 |
| `B-07` | Auth UI | Implement `/login`, `/invite/[token]`, `/redeem`, and `/join` invite-only registration & pass redemption UIs | `B-02` | P0 |
| `B-08` | App Workspace | Implement `/app` dashboard (104-template New Project modal, Import GitHub/ZIP, filters, Account modals) | `B-04, B-07` | P0 |
| `B-09` | Project IDE | Implement `/app/projects/[projectId]` (Visual/Source/Preview, Quick open `⌘P`, Files/Outline, Search/Replace, GitHub, Version History, Comments, Review, Orca AI, Share modal) | `B-05, B-08` | P0 |
| `B-10` | Research Library | Implement `/app/library` (Facets, In-Library & live Web Search, PDF/DOCX/BibTeX upload, Reference Detail editor, PDF Reader with Highlights & Sticky Notes, Cite in Project) | `B-08` | P0 |
| `B-11` | Settings & Sysop | Implement `/app/settings/*` (`Account`, `My plan and billing`, `API connection`, `Labs`) and `/sysop` 8-tab Operator Console | `B-02, B-08` | P0 |
| `B-12` | Verification | Write & run unit/integration tests, Playwright E2E tests (desktop & mobile), and production build check | `B-06..B-11` | P0 |

---

## 3. Acceptance Criteria (AC)

- **AC-01 (No Dummy/Demo Accounts)**: Fresh database initialization contains 0 demo users. Admin is provisioned via `npm run bootstrap:admin`.
- **AC-02 (Fail-Closed Invite-Only Registration)**: `POST /api/auth/register` without a valid `AccountInvitation` token or `InviteCodePass` code returns `403 invitation_required`.
- **AC-03 (Single-Use & Expiring Invitations / Codes)**: Once an `AccountInvitation` or single-use `InviteCodePass` is used to register, any second attempt to use the same token/code fails with `410` (`invalid_invitation` / `code_exhausted`). Expired or revoked tokens/codes also fail with `410`.
- **AC-04 (Role-Based Access Control & Revocation)**:
  - Only `Admin` users can access `/sysop` and `/api/sysop/*` or `/api/admin/invitations/*`; `Researcher` and `Viewer` receive `403`.
  - `Viewer` users cannot create new projects (`POST /api/projects` returns `403`) or edit files unless granted `EDITOR` on a project.
  - Revoking a user or their session immediately invalidates their cookie session on the next request.
- **AC-05 (Immutable Audit Log)**: Every bootstrap, login, registration, invitation create/rotate/revoke/accept, pass issue/redeem/revoke, role change, and session revocation creates a verifiable row in `AuditLog` visible in `/sysop` (`Audit log` tab).
- **AC-06 (104 Venue Templates & Project Creation Gate)**: In `/app`, clicking `+ New project` opens the modal with all 104 academic templates across 10 categories; `Create project` is disabled until both a template radio and project name are provided, and creating the project initializes the venue-specific files and opens `/app/projects/[projectId]`.
- **AC-07 (Multi-Format Workspace, Modes, Collaboration & Orca AI)**: `/app/projects/[projectId]` supports switching between `Visual`, `</> Source`, and `Preview`, compiling LaTeX/Typst/Markdown/Slides/BibTeX, searching across files, saving/restoring versions, adding/resolving comments, running Writing/Citation/Accessibility reviews, applying Orca AI diff proposals, and managing project/folder/file sharing.
- **AC-08 (Research Library & Live Web Search)**: `/app/library` supports filtering by tags/year/authors/venues/trash, searching live scholarly papers via `Web search`, adding papers to the library, editing metadata/BibTeX, highlighting & adding sticky notes in the reader, and citing a paper directly into a project.
- **AC-09 (Responsive Layout & Clean Build)**: Desktop (`1440×900`) and mobile (`390×844`) viewports render cleanly without horizontal overflow or runtime errors, and `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` all pass.
