# CorTeX by Corca — Academic Research & Writing Workspace

Production-ready full-stack implementation of **CorTeX by Corca** (`https://cortex.corca.ai` & `https://cortex.corca.ai/app`), built with **Next.js 16 (App Router)**, **Auth.js / NextAuth v4**, **Prisma 7** (SQLite for local development, PostgreSQL for production), **Invite-Only Registration**, **Single-Use & Bounded-Use Expiring Pass Codes**, **RBAC Authorization**, **Immediate Session Revocation**, and **Immutable Security Audit Logging**.

---

## Architecture & Documentation

All exploration artifacts, screenshots, and architectural specifications are located in:

- [`docs/00_EXPLORATION_AND_PARITY_MATRIX.md`](docs/00_EXPLORATION_AND_PARITY_MATRIX.md) — Systematic Playwright exploration coverage across 32 desktop & mobile states and feature-parity matrix
- [`docs/01_ADR.md`](docs/01_ADR.md) — Architecture Decision Records (ADR-001 through ADR-008)
- [`docs/02_PRD.md`](docs/02_PRD.md) — Product Requirements Document
- [`docs/03_TECHNICAL_SPEC_AND_DATA_MODEL.md`](docs/03_TECHNICAL_SPEC_AND_DATA_MODEL.md) — Technical Specification & Dual SQLite/PostgreSQL Data Model
- [`docs/04_IMPLEMENTATION_PLAN_BACKLOG_AND_AC.md`](docs/04_IMPLEMENTATION_PLAN_BACKLOG_AND_AC.md) — Implementation Plan, Task Backlog & Acceptance Criteria
- [`docs/05_AUTH_INVITE_RBAC_AUDIT_SPEC.md`](docs/05_AUTH_INVITE_RBAC_AUDIT_SPEC.md) — Invite-Only Admission, Single-Use Invitations, Code Passes, RBAC, Revocation & Audit Log Spec

---

## Key Capabilities

1. **Public Portal & Browser Trial (`/`, `/gallery`, `/docs/en`, `/legal/[locale]/[doc]`, `/try/[[...slug]]`)**:
   - 9-language hero localization, interactive 4-format preview switcher (`LaTeX`, `Typst`, `Markdown`, `Presentation`), feature comparison matrix, and pricing tiers.
   - Instant unauthenticated browser workspace (`/try/tex`, `/try/typ`, `/try/md`, `/try/slides`) with 5-step guided tour (`?tour=1`), `/` academic phrasebank, and live compilation.
   - Open Workspace gallery (`/gallery`, `/gallery/tags/[tag]`) and searchable Documentation Portal (`/docs/en`, `/docs/en/guides/latex-for-beginners`).
2. **Invite-Only Registration, Single-Use Invitations & Code Passes (`/login`, `/invite/[token]`, `/redeem`, `/join`)**:
   - Zero pre-seeded demo or dummy accounts.
   - Single-use expiring email-bound invitations (`/invite/[token]`) and single-use/bounded-use expiring Code Passes (`CTX-XXXX-XXXX-XXXX` at `/redeem`).
   - CLI bootstrap (`npm run bootstrap:admin`) for initial `Admin` provisioning.
3. **Signed-In Workspace & 104 Official Academic Venue Templates (`/app`, `/app/projects/[projectId]`)**:
   - 104 official templates across 10 categories (`Blank & Multi-Format`, `AI & ML Conferences`, `Computer Science & IEEE/ACM`, `Mathematics & Physics`, `Nature, Science & Medical`, `Multidisciplinary & Publishers`, `Theses & Dissertations`, `Presentations & Posters`, `CV, Letters & Grants`, `Korean & Asian Academic Venues`).
   - 6-tab left sidebar (`Files`, `Outline`, `Search`, `Orca AI` with `Ask`/`Edit Diff`, `Review` diagnostics & inline comments, `Timeline` version snapshots).
   - Project, Folder, and Single-File scoped RBAC (`OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`).
4. **3-Pane Research Library (`/app/library`)**:
   - Faceted filtering (`Tags`, `No tag`, `Publication Year`, `Unknown year`, `Authors`, `Journal / Conference`, `Trash`).
   - In-library search + live OpenAlex scholarly web search, PDF Reader with inline highlights & sticky notes, and one-click `\cite{key}` BibTeX injection.
5. **Sysop Operator Console (`/sysop`)**:
   - 8-section operator console (`Overview`, `Product analytics`, `Users & RBAC`, `Metadata & storage`, `Contracts & passes`, `Activity ranking`, `Operations`, `Audit log`) with CSV/JSON audit export.

---

## Quick Start (Local Development — SQLite)

```bash
# 1. Install dependencies & generate Prisma client
npm install
npm run prisma:generate

# 2. Push SQLite schema
npm run db:push

# 3. Bootstrap the initial Admin account (no dummy accounts are pre-seeded)
printf '%s\n' 'StrongPass123!' | npm run bootstrap:admin -- \
  --email admin@corca.ai \
  --name "CorTeX Operator" \
  --password-stdin

# 4. Run development server
npm run dev
```

## Testing & Verification

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```
