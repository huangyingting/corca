# Architecture Decision Records (ADR) — CorTeX by Corca

## ADR-001: Next.js 16 App Router, React 19, TypeScript & OKLCH Design Tokens

- **Status**: Accepted
- **Context**: `cortex.corca.ai` combines public marketing/gallery/docs pages, an instant browser trial (`/try/*`), a high-density 3-pane Research Library (`/app/library`), a multi-file academic IDE (`/app/projects/[projectId]`), and a System Operator console (`/sysop`).
- **Decision**:
  - Build on **Next.js 16 (`^16.4.2`) App Router** with **React 19** and strict **TypeScript (`^5.7.2`)**.
  - Recreate the exact `bootstrap-CuBHaTiw.css` OKLCH/Hex token hierarchy (`--color-seed-neutral: #707882`, `--color-seed-brand: #4375c9`, primary dark-navy CTA `#1e3a6e`, surface `#f8f9fb`, dark-mode variables) using Tailwind CSS + CSS custom properties.
  - Support responsive desktop (`>=1024px`), tablet (`768px–1023px`), and mobile (`<768px`) layouts with collapsible activity drawers and pane switchers.
- **Consequences**: Unified server/client rendering, zero-config route handlers under `src/app/api/*`, and visual fidelity to the original `cortex.corca.ai` interface.

---

## ADR-002: Dual SQLite (Local Development) and PostgreSQL (Production) Prisma 7 Architecture

- **Status**: Accepted
- **Context**: The application must use **SQLite for local development** (`file:./dev.db`) and **PostgreSQL for production** (`postgresql://...`) with Prisma 7 driver adapters, migrations, and zero schema drift.
- **Decision**:
  - Maintain `prisma/schema.prisma` (SQLite datasource) and `prisma/schema.postgres.prisma` (PostgreSQL datasource) with identical models, fields, relations, and indexes.
  - Use `@prisma/adapter-better-sqlite3` when `DATABASE_URL` starts with `file:` and `@prisma/adapter-pg` when `DATABASE_URL` starts with `postgres://` or `postgresql://` in `src/lib/prisma.ts`.
  - Configure `prisma.config.ts` to route migrations to `prisma/migrations/sqlite` or `prisma/migrations/postgresql` based on `--schema`.
  - Store enum-like state fields (`status`, `role`, `planTier`, `format`) as validated `String` columns so migrations are 100% compatible across both SQLite and PostgreSQL.
- **Consequences**: Instant local setup and testing with SQLite while supporting horizontal production scaling on PostgreSQL.

---

## ADR-003: Auth.js / NextAuth v4 Database Sessions & Fail-Closed Invite-Only Admission

- **Status**: Accepted
- **Context**: We must prevent unauthorized public sign-ups, forbid dummy/demo accounts, and require single-use/expiring invitation codes or email invitations for account registration, following the `../Arcade` reference architecture.
- **Decision**:
  - Use `next-auth` (`^4.24.15`) with `@auth/prisma-adapter` and **database sessions** (`Session` table) plus custom credential/invitation session creation via `createDatabaseSession()` and HTTP-only session cookies (`next-auth.session-token` / `__Secure-next-auth.session-token`).
  - Default `ACCOUNT_ADMISSION_MODE` to `"invitation-only"` (fail-closed).
  - Support two complementary single-use/expiring admission mechanisms matching both `../Arcade` and `cortex.corca.ai/sysop`:
    1. **Email-Bound Single-Use Invitation (`AccountInvitation`)**: Cryptographic 32-byte base64url token where only `tokenHash = sha256(token)` is stored in the database, `activeForEmail @unique` guarantees at most one active pending invite per email, and claiming atomically transitions `PENDING -> ACCEPTED` while clearing `tokenHash` and `activeForEmail`.
    2. **Single-Use / Bounded-Use Expiring Invite Code Pass (`InviteCodePass`)**: Issued by an Admin in `/sysop` (`CTX-XXXX-XXXX-XXXX`), with configurable `role` (`Admin`, `Researcher`, `Viewer`), `planTier` (`free`, `standard`, `pro`), `durationDays`, `maxUses` (default `1` for single-use), and `expiresAt`. Redeeming a code during registration (`/join` or `/redeem`) or in Account Settings atomically increments `usedCount`, transitions to `CONSUMED` once `usedCount >= maxUses`, and records an `InviteCodeRedemption`.
  - Provision the initial root `Admin` strictly via host CLI (`npm run bootstrap:admin -- --email <email> --password-stdin`). **No public HTTP bootstrap endpoint exists.**
- **Consequences**: Zero uninvited sign-ups, cryptographic token storage, atomic single-use claim semantics, and zero demo/dummy accounts in the database.

---

## ADR-004: Multi-Tier Role-Based Access Control (RBAC) & Immediate Revocation

- **Status**: Accepted
- **Context**: Users need system-level roles (`Admin`, `Researcher`, `Viewer`) as well as resource-level access control on projects, folders, and files (`OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`), plus instant revocation of invitations, passes, share links, and user sessions.
- **Decision**:
  - **System Roles (`User.role`)**:
    - `Admin`: Full access to `/sysop` operator console, invitation & code pass issuance/revocation, user role/status management, operator plan grants, and audit logs, plus full researcher capabilities.
    - `Researcher` (alias `Creator`): Can create/import projects, edit owned/collaborative projects, use the Research Library, run Orca AI, and share projects.
    - `Viewer`: Read-only access to shared projects, public gallery, and documentation; cannot create new projects or mutate system state unless upgraded.
  - **Account Status & Session Revocation (`User.status`, `User.sessionVersion`)**:
    - Suspending/revoking a user (`status = "suspended"` or `"revoked"`), changing their role, or revoking their pass immediately deletes all rows in `Session` for that `userId` and increments `sessionVersion`.
    - Server-side `getCurrentUser()` checks both `Session.expires > now` and `User.status === "active"`.
  - **Resource-Level ACL (`ProjectCollaborator` & `ProjectShareLink`)**:
    - Supports `scopeType` (`PROJECT`, `FOLDER`, `FILE`) and `permission` (`VIEWER`, `COMMENTER`, `EDITOR`, `OWNER`).
- **Consequences**: Fine-grained authorization enforced uniformly across Next.js route handlers and UI components, with zero stale-session window after revocation.

---

## ADR-005: Immutable Append-Only Security & Operator Audit Log (`AuditLog`)

- **Status**: Accepted
- **Context**: Every security-sensitive action (bootstrap, login, failed login, registration, invitation created/rotated/revoked/accepted, code pass issued/redeemed/revoked, role change, account suspension/revocation, project sharing, operator plan grant) must be traceable.
- **Decision**:
  - Persist all security and operator events in an append-only `AuditLog` table containing `id`, `actorId`, `actorEmail`, `action`, `targetType`, `targetId`, `targetLabel`, `ipAddress`, `userAgent`, `reason`, `metadataJson`, and `createdAt`.
  - Expose read-only filtering, search, and CSV export in `/sysop` (`Audit log` tab) and `/api/sysop/audit` restricted strictly to `Admin` users.
  - Provide no `DELETE` or `UPDATE` API for `AuditLog` records.
- **Consequences**: Full compliance with enterprise and academic security auditing requirements.

---

## ADR-006: Multi-Format Academic Typesetting Engine (LaTeX, Typst, Markdown, Slides, BibTeX, DOCX)

- **Status**: Accepted
- **Context**: CorTeX supports live authoring and compilation across **LaTeX (`.tex`)**, **Typst (`.typ`)**, **Markdown (`.md`)**, **Slides (`slides.md` / Beamer)**, **BibTeX (`.bib`)**, and **Word (`.docx`)**, with `Visual`, `</> Source`, and `Preview` modes plus SyncTeX line mapping and 104 official academic venue templates.
- **Decision**:
  - Build a deterministic, high-fidelity multi-format typesetting & compilation engine (`src/lib/compiler/*`) that parses:
    - **LaTeX (`.tex`)**: Document class & venue style (`sn-jnl`, `IEEEtran`, `acmart`, `iclr2027`, `neurips_2026`, `acl`, `cvpr`, `revtex4-2`, `beamer`, etc.), preamble macros (`\newcommand`), title/author/affiliation/abstract/keywords metadata, hierarchical sections (`\section`, `\subsection`, `\subsubsection`), equations (inline `$...$`, `\[...\]`, `\begin{equation}`, `\begin{align}`), tables (`tabular`, `booktabs`), figures (`\includegraphics`, `\caption`), theorems/proofs/algorithms, and bibliography citations (`\cite`, `\citep`, `\citet`) resolved against project `.bib` files.
    - **Typst (`.typ`)**: `#set page/text`, `= Heading`, math `$...$`, `#figure`, `#table`, and `@citation` references.
    - **Markdown (`.md`) & Slides (`slides.md`)**: YAML frontmatter, GFM tables/task lists/code blocks, math blocks, and `---` slide separators with speaker notes.
    - **BibTeX (`.bib`)**: Full BibTeX parser & formatter producing structured IEEE/APA/Natbib bibliography entries and citation hover cards.
  - Generate paginated, print-accurate **Academic Page Previews** (with column layouts matching 1-column or 2-column venue templates, clickable SyncTeX source-line correspondence, zoom controls, dark-mode inversion option, compile log & diagnostics, and downloadable PDF/HTML/ZIP artifacts).
- **Consequences**: Instant, sub-100ms live compilation and preview in the browser and on the server without requiring a multi-gigabyte TeX Live container runtime, while remaining 100% compatible with real `.tex`, `.bib`, `.typ`, and `.md` project archives.

---

## ADR-007: "Orca" AI Coauthoring & Review Assistant with Diff Patch Proposals

- **Status**: Accepted
- **Context**: CorTeX features "Orca" ("AI that proposes. You decide.") for editing, tightening, translating, or explaining academic prose, plus automated Writing Review, Citation Review, and Accessibility Review diagnostics.
- **Decision**:
  - Integrate **Azure OpenAI** (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` configured from environment) AND user-level **BYOK OpenAI API Key** (`/app/settings/api-key`) in `src/lib/ai/orca-engine.ts`.
  - When a user prompts Orca in the workspace (`Ask AI to edit, tighten, or explain your source`), the backend generates a structured response containing an explanation and a **proposed unified/line diff patch** (`originalSnippet` -> `proposedSnippet`) that the user can inspect and click **Accept (`Apply to file`)** or **Dismiss**.
  - Include a built-in deterministic **Writing, Citation & Accessibility Review Linter** that checks for uncited claims, undefined `\cite{...}` keys against `.bib` files, missing `\label` / `\ref` targets, figure `\alt` / caption completeness, weasel words, and passive voice density, augmented by AI suggestions when invoked.
- **Consequences**: Real LLM-powered coauthoring out of the box with user-controlled accept/reject safety and deterministic offline-capable academic lint checks.

---

## ADR-008: Personal Research Library, Live Scholarly Discovery & PDF/Document Reader

- **Status**: Accepted
- **Context**: `/app/library` allows researchers to organize papers by tags, publication year, authors, and venues; search scholarly databases (`Web search`); upload PDF/EPUB/DOCX files; edit reference metadata/BibTeX; and read papers with highlights and sticky notes.
- **Decision**:
  - Implement live scholarly `Web search` in `/api/library/search-web` querying **OpenAlex / Crossref / Semantic Scholar / arXiv** public APIs with structured normalization (title, authors, year, venue, DOI, citationCount, referenceCount, abstract, openAccessPdfUrl, generated `citeKey` & BibTeX).
  - Support local file upload (`PDF`, `EPUB`, `DOCX`, `.bib`) stored in `storage/library/` and linked to `LibraryReference`.
  - Provide an interactive Reader pane in `/app/library` supporting text/page rendering, highlight creation (`LibraryAnnotation` with `kind = "highlight"`, color, selectedText, pageNumber), and anchored sticky notes (`kind = "sticky"`, comment text), plus one-click **Cite in project** (which inserts the BibTeX entry into the target project's `refs.bib` and copies `\cite{citeKey}`).
- **Consequences**: End-to-end "Read a paper. Bring its evidence into your draft." workflow between `/app/library` and `/app/projects/[projectId]`.
