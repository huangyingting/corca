# Technical Specification, Architecture & Data Model — CorTeX by Corca

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           Client Layer (Next.js 16 + React 19)                        │
│  ┌──────────────────────┐ ┌────────────────────────┐ ┌─────────────────────────────┐ │
│  │ Public & Onboarding  │ │ Collaborative Workspace│ │ Research Library & Sysop    │ │
│  │ /, /gallery, /docs/* │ │ /app, /app/projects/*  │ │ /app/library, /app/settings │ │
│  │ /try/*, /login       │ │ Visual / Source / PDF  │ │ /sysop (8 Operator Tabs)    │ │
│  │ /invite/*, /redeem   │ │ Orca AI + Phrasebank   │ │ Reader + Highlights + Notes │ │
│  └──────────┬───────────┘ └───────────┬────────────┘ └──────────────┬──────────────┘ │
└─────────────┼─────────────────────────┼─────────────────────────────┼────────────────┘
              │                         │                             │
              ▼                         ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                      Application & API Layer (Next.js Route Handlers)                 │
│  ┌──────────────────────┐ ┌────────────────────────┐ ┌─────────────────────────────┐ │
│  │ Auth & Admission     │ │ Workspace & Compiler   │ │ Library, AI & Sysop         │ │
│  │ NextAuth v4 DB Sess  │ │ /api/projects/*        │ │ /api/library/* (Web + Local)│ │
│  │ AccountInvitation    │ │ /api/compile (TeX/Typ/ │ │ /api/ai/orca (Azure + BYOK) │ │
│  │ InviteCodePass       │ │  MD/Slides/BibTeX/DOCX)│ │ /api/sysop/* & /api/admin/* │ │
│  │ RBAC + Session Guard │ │ Share ACL + Git Sync   │ │ Immutable AuditLog Service  │ │
│  └──────────┬───────────┘ └───────────┬────────────┘ └──────────────┬──────────────┘ │
└─────────────┼─────────────────────────┼─────────────────────────────┼────────────────┘
              │                         │                             │
              ▼                         ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│               Persistence & External Integration Layer (Prisma 7 Adapter)             │
│  ┌────────────────────────────────────┐ ┌──────────────────────────────────────────┐ │
│  │ Dual-Engine Relational Database    │ │ Live Integrations & Local Storage        │ │
│  │ • Local Dev: SQLite (better-sqlite)│ │ • Azure OpenAI / BYOK OpenAI Chat API    │ │
│  │ • Production: PostgreSQL (@prisma/ │ │ • OpenAlex / Crossref / arXiv Scholarly  │ │
│  │   adapter-pg)                      │ │ • storage/library & storage/projects     │ │
│  └────────────────────────────────────┘ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Canonical Prisma Data Model (`prisma/schema.prisma` & `prisma/schema.postgres.prisma`)

Both `prisma/schema.prisma` (SQLite) and `prisma/schema.postgres.prisma` (PostgreSQL) share the exact same models, relations, and indexes:

### 2.1 Identity, NextAuth, Invite-Only Admission & Pass Management
- **`User`**:
  - `id` (`String @id @default(cuid())`)
  - `email` (`String @unique`)
  - `emailVerified` (`DateTime?`)
  - `name` (`String @default("")`)
  - `image` (`String?`)
  - `role` (`String @default("Researcher")`) — `"Admin" | "Researcher" | "Viewer"`
  - `status` (`String @default("active")`) — `"active" | "suspended" | "revoked" | "deleting"`
  - `planTier` (`String @default("free")`) — `"free" | "standard" | "pro"`
  - `operatorGrantPlan` (`String?`) — `"free" | "standard" | "pro" | null`
  - `uiLanguage` (`String @default("en")`) — `"en" | "ko" | "ja" | "zh-CN" | "zh-TW" | "es" | "pt-BR" | "fr" | "de"`
  - `dailyTokensUsed` (`Int @default(0)`), `monthlyTokensUsed` (`Int @default(0)`), `storageBytesUsed` (`Int @default(0)`)
  - `labsConfigJson` (`String @default("{}")`)
  - `byokOpenAiKeyEncrypted` (`String?`), `byokOpenAiKeyHint` (`String?`)
  - `sessionVersion` (`Int @default(1)`)
  - `lastActiveAt` (`DateTime @default(now())`), `createdAt`, `updatedAt`
- **`Account`**, **`Session`**, **`VerificationToken`**:
  - Standard NextAuth database-session models (`Session.sessionToken @unique`, `Account.provider_providerAccountId @@unique`).
- **`PasswordCredential`**:
  - `id`, `userId @unique`, `passwordHash` (`scrypt` with random 16-byte salt), `passwordChangedAt`, `resetTokenHash @unique`, `resetExpiresAt`.
- **`AccountInvitation`** (Email-Targeted Single-Use Expiring Invitations — `../Arcade` compatible):
  - `id`, `email`, `normalizedEmail`, `activeForEmail @unique`, `tokenHash @unique`, `status` (`"PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED"`), `role` (`"Admin" | "Researcher" | "Viewer"`), `planTier` (`"free" | "standard" | "pro"`), `invitedById`, `acceptedById`, `expiresAt`, `acceptedAt`, `revokedAt`, `reason`, `createdAt`, `updatedAt`.
- **`InviteCodePass`** (Shareable Single-Use or Bounded-Use Expiring Code Passes — `/sysop` & `/redeem`):
  - `id`, `codeHash @unique`, `codePrefix` (`CTX-XXXX-...`), `rawCode` (optional for operator copy until first redemption or revocation), `name`, `role` (`"Admin" | "Researcher" | "Viewer"`), `planTier` (`"free" | "standard" | "pro"`), `durationDays` (`Int @default(30)`), `maxUses` (`Int @default(1)`), `usedCount` (`Int @default(0)`), `status` (`"ACTIVE" | "CONSUMED" | "REVOKED" | "EXPIRED"`), `contractRef`, `reason`, `issuedById`, `expiresAt`, `revokedAt`, `createdAt`, `updatedAt`.
- **`InviteCodeRedemption`**:
  - `id`, `codePassId`, `userId`, `redeemedAt`, `accessEndsAt`, `status` (`"ACTIVE" | "REVOKED" | "EXPIRED"`).
- **`Organization`** & **`OrganizationMember`**:
  - Supports `/sysop` Contracts & Passes -> Organizations (`name`, `slug @unique`, `contractRef`, `adminEmail`, `status`, `startsAt`, `endsAt`, `standardSeats`, `proSeats`, `reason`).
- **`AccountEmailOutbox`**:
  - Outbox queue for invitation/pass delivery and operator diagnostics (`payload`, `status`, `lastAttemptAt`, `sentAt`, `invitationId`).
- **`AuditLog`** (Immutable Append-Only Security & Staff Activity Log):
  - `id`, `actorId`, `actorEmail`, `actorRole`, `action`, `targetType`, `targetId`, `targetLabel`, `ipAddress`, `userAgent`, `reason`, `metadataJson`, `createdAt`.

### 2.2 Projects, Multi-File Workspace, Version History, Comments, Review & Sharing
- **`Project`**:
  - `id` (`String @id @default(cuid())`)
  - `name`, `description`, `format` (`"latex" | "typst" | "markdown" | "slides" | "docx"`)
  - `templateId` (`String @default("blank-article")`), `texliveVersion` (`String @default("tl2026-20260826-b6584b4")`), `latexEngine` (`String @default("auto")`), `mainFilePath` (`String @default("main.tex")`)
  - `ownerId`, `isPinned` (`Boolean @default(false)`), `visibility` (`"private" | "shared" | "public"`)
  - `gitRepoUrl` (`String?`), `gitBranch` (`String @default("main")`), `gitLastSyncAt` (`DateTime?`)
  - `createdAt`, `updatedAt`
- **`ProjectFile`**:
  - `id`, `projectId`, `path` (`@@unique([projectId, path])`), `name`, `folderPath`, `kind` (`"tex" | "typ" | "md" | "slides" | "bib" | "cls" | "sty" | "docx" | "asset"`), `content` (`String`), `sizeBytes` (`Int`), `isMain` (`Boolean @default(false)`), `createdAt`, `updatedAt`.
- **`ProjectVersion`**:
  - `id`, `projectId`, `label`, `summary`, `snapshotJson` (full serialized file tree state), `createdById`, `createdAt`.
- **`ProjectComment`**:
  - `id`, `projectId`, `filePath`, `lineNumber` (`Int?`), `anchorText` (`String?`), `content`, `status` (`"open" | "resolved"`), `parentId` (`String?`), `authorId`, `createdAt`, `updatedAt`.
- **`ProjectCollaborator`**:
  - `id`, `projectId`, `userId` (`String?`), `email`, `permission` (`"VIEWER" | "COMMENTER" | "EDITOR"`), `scopeType` (`"PROJECT" | "FOLDER" | "FILE"`), `scopePath` (`String @default("/")`), `invitedById`, `status` (`"ACTIVE" | "REVOKED"`), `createdAt`, `updatedAt`.
- **`ProjectShareLink`**:
  - `id`, `projectId`, `tokenHash @unique`, `tokenPreview`, `permission` (`"VIEWER" | "COMMENTER" | "EDITOR"`), `scopeType` (`"PROJECT" | "FOLDER" | "FILE"`), `scopePath` (`String @default("/")`), `expiresAt` (`DateTime?`), `revokedAt` (`DateTime?`), `createdById`, `createdAt`.
- **`GalleryPublication`**:
  - `id`, `projectId`, `authorId`, `title`, `summary`, `category` (`"Papers" | "Notes" | "Slides" | "Templates"`), `format`, `tagsJson`, `contentPreview`, `snapshotJson`, `createdAt`, `updatedAt`.

### 2.3 Research Library & Annotations
- **`LibraryReference`**:
  - `id`, `userId`, `title`, `citeKey`, `authorsJson` (`String` — JSON array of author names), `year` (`Int?`), `venue` (`String?`), `doi` (`String?`), `arxivId` (`String?`), `openAlexId` (`String?`), `url` (`String?`), `abstract` (`String?`), `note` (`String?`), `tagsJson` (`String @default("[]")`), `bibtex` (`String`), `pdfFileName` (`String?`), `pdfStoragePath` (`String?`), `pdfSizeBytes` (`Int @default(0)`), `pdfTextContent` (`String?`), `citationCount` (`Int @default(0)`), `referenceCount` (`Int @default(0)`), `inTrash` (`Boolean @default(false)`), `createdAt`, `updatedAt`.
- **`LibraryAnnotation`**:
  - `id`, `referenceId`, `userId`, `kind` (`"highlight" | "sticky"`), `pageNumber` (`Int @default(1)`), `selectedText` (`String?`), `comment` (`String?`), `color` (`String @default("yellow")`), `rectJson` (`String @default("{}")`), `createdAt`, `updatedAt`.

---

## 3. REST API Contract Specification

| Endpoint | Methods | Auth / Role | Purpose |
|---|---|---|---|
| `/api/auth/[...nextauth]` | `GET, POST` | Public / Session | NextAuth v4 session & OAuth provider endpoints |
| `/api/auth/login` | `POST` | Public | Email + password login (`authenticatePassword`), issues DB session cookie & logs audit event |
| `/api/auth/logout` | `POST` | Authenticated | Deletes current DB `Session`, clears cookie, records audit event |
| `/api/auth/register` | `POST` | Public (Gated) | Registers a user strictly via `AccountInvitation` token OR `InviteCodePass` code |
| `/api/auth/invitation` | `GET` | Public | Inspects an `AccountInvitation` token (`pending`, `accepted`, `revoked`, `expired`, `invalid`) |
| `/api/auth/redeem` | `GET, POST` | Public / Auth | Inspects or redeems an `InviteCodePass` (`CTX-...`) during sign-up or for an existing account |
| `/api/account/profile` | `GET, PATCH, DELETE` | Authenticated | Reads/updates user profile, `uiLanguage`, `labsConfigJson`, password, or initiates account deletion |
| `/api/account/byok/openai` | `GET, PUT, DELETE` | Authenticated | Manages user's personal OpenAI API key (`BYOK`) |
| `/api/account/passes` | `GET, POST` | Authenticated | Lists active passes/invitations and redeems a pass code |
| `/api/projects` | `GET, POST` | `Researcher+` | Lists projects (`All`, `Mine`, `Shared`, `Pinned`, search) or creates/imports a project from any of the 104 templates / GitHub / ZIP |
| `/api/projects/[id]` | `GET, PATCH, DELETE` | Project ACL | Retrieves full project workspace state, updates project metadata/pin/mainFile/engine, or deletes project |
| `/api/projects/[id]/files` | `GET, POST, PATCH, DELETE` | Project ACL | Creates, updates, renames, moves, or deletes project files & folders |
| `/api/projects/[id]/compile` | `POST` | Project ACL / Public Try | Compiles LaTeX / Typst / Markdown / Slides / BibTeX / DOCX into structured paginated preview + SyncTeX map + logs + downloadable HTML/PDF |
| `/api/projects/[id]/search` | `POST` | Project ACL | Searches and optionally replaces text across all files in a project |
| `/api/projects/[id]/versions` | `GET, POST` | Project ACL | Lists version history snapshots, creates named version milestone, or restores a snapshot |
| `/api/projects/[id]/comments` | `GET, POST, PATCH, DELETE` | Project ACL | Lists, creates, replies to, resolves/reopens, or deletes anchored inline comments |
| `/api/projects/[id]/review` | `POST` | Project ACL | Runs Writing Review, Citation Review, and Accessibility Review diagnostics |
| `/api/projects/[id]/share` | `GET, POST, PATCH, DELETE` | `OWNER / EDITOR` | Manages granular collaborators (`People`) and share links (`Links`) scoped to Project, Folder, or File |
| `/api/projects/[id]/git` | `GET, POST` | `OWNER / EDITOR` | Connects GitHub repository, commits workspace changes, and syncs version history |
| `/api/ai/orca` | `POST` | Authenticated / Try | Invokes Orca AI Assistant (Azure OpenAI / BYOK OpenAI) to propose diff edits, tighten prose, generate BibTeX/equations, or explain LaTeX errors |
| `/api/library` | `GET, POST` | Authenticated | Lists library references with faceted filters (`tag`, `yearFrom`, `yearTo`, `author`, `venue`, `q`, `trash`) or adds a reference (manual/BibTeX/DOI/file/web) |
| `/api/library/[id]` | `GET, PATCH, DELETE` | Authenticated | Updates reference metadata/tags/trash state, uploads/attaches PDF/EPUB/DOCX, or permanently deletes |
| `/api/library/[id]/annotations` | `GET, POST, PATCH, DELETE` | Authenticated | Creates, updates, or deletes PDF/document highlights and sticky notes |
| `/api/library/[id]/cite` | `POST` | `Researcher+` | Injects the reference's BibTeX entry into a selected project's `.bib` file and returns `\cite{citeKey}` |
| `/api/library/search-web` | `GET` | Authenticated | Queries live scholarly databases (OpenAlex / Crossref / arXiv) with resilient fallback |
| `/api/gallery` | `GET, POST` | Public / `Researcher+` | Lists Open Workspace gallery items with category/topic/sort filters, or publishes/forks a project |
| `/api/admin/invitations` | `GET, POST` | `Admin` | Lists and creates single-use email invitations (`AccountInvitation`) |
| `/api/admin/invitations/[id]` | `PATCH, DELETE` | `Admin` | Rotates or revokes an `AccountInvitation` |
| `/api/sysop/overview` | `GET` | `Admin` | Operational metrics, hourly/daily trends, pending operations, and global project directory search |
| `/api/sysop/users` | `GET, PATCH` | `Admin` | Searches users, updates system `role` (`Admin`, `Researcher`, `Viewer`), sets `operatorGrantPlan`, suspends/revokes user, or revokes all active sessions |
| `/api/sysop/passes` | `GET, POST, PATCH` | `Admin` | Issues, extends, or revokes single-use/bounded-use `InviteCodePass` batches and `PersonalPass` grants |
| `/api/sysop/organizations` | `GET, POST, PATCH` | `Admin` | Creates, updates, or terminates organization seat contracts |
| `/api/sysop/activity` | `GET` | `Admin` | Ranks most active writers by version history and exports CSV |
| `/api/sysop/audit` | `GET` | `Admin` | Queries and exports the immutable `AuditLog` |
