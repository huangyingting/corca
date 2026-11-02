# Invite-Only Authentication, RBAC, Revocation & Audit Logging Specification

## 1. Security Model Overview

CorTeX implements a defense-in-depth, fail-closed authentication and authorization architecture modeled after `../Arcade` (`src/lib/account-admission/*`) and extended to support CorTeX's `/sysop` operator pass/code management:

1. **Zero Public Sign-Up (`ACCOUNT_ADMISSION_MODE = "invitation-only"`)**:
   - Uninvited visitors cannot create an account via email/password or OAuth.
   - All account creation requires either a valid email-bound `AccountInvitation` token (`/invite/[token]`) or a valid `InviteCodePass` code (`/redeem` / `/join`).
2. **Zero HTTP Bootstrap Surface**:
   - No HTTP endpoint can create the initial administrator.
   - Only a host operator with CLI access can run:
     ```bash
     printf '%s\n' '<StrongPassword>' | npm run bootstrap:admin -- --email admin@corca.ai --name "CorTeX Operator" --password-stdin
     ```
3. **Cryptographic Token & Code Hashing**:
   - Email invitation tokens (`32 bytes` random `base64url`) are never persisted in plaintext; only `SHA-256(token)` is stored in `AccountInvitation.tokenHash`.
   - Shareable code passes (`CTX-XXXX-XXXX-XXXX`) store `codeHash = SHA-256(normalizedCode)` for lookup and atomic redemption.
4. **Atomic Single-Use & Expiration Enforcement**:
   - Claiming an `AccountInvitation` runs inside a Prisma `$transaction` using conditional `updateMany({ where: { id, status: "PENDING", tokenHash, expiresAt: { gt: now } } })`. If `count === 0`, the transaction aborts with `410 Gone`.
   - Claiming an `InviteCodePass` runs inside a Prisma `$transaction` using conditional `updateMany({ where: { id, status: "ACTIVE", expiresAt: { gt: now }, usedCount: { lt: pass.maxUses } } })`, incrementing `usedCount` and transitioning `status` to `"CONSUMED"` when `usedCount + 1 >= maxUses`.

---

## 2. Role Hierarchy & Permission Matrix

### 2.1 System Roles (`User.role`)

| Capability | `Admin` (Sysop) | `Researcher` (Creator) | `Viewer` |
|---|---|---|---|
| Access `/`, `/gallery`, `/docs/*`, `/try/*` | Yes | Yes | Yes |
| Sign in to `/app` & manage `/app/settings/*` | Yes | Yes | Yes |
| Create or import new projects (`POST /api/projects`) | Yes | Yes | No (`403`) |
| Edit owned projects & run Orca AI | Yes | Yes | Only if granted `EDITOR` on project |
| Curate personal Research Library (`/app/library`) | Yes | Yes | Read-only |
| Publish projects to `/gallery` | Yes | Yes | No (`403`) |
| Access `/sysop` Operator Console | Yes | No (`403`) | No (`403`) |
| Issue / rotate / revoke `AccountInvitation` & `InviteCodePass` | Yes | No (`403`) | No (`403`) |
| Change user roles, operator plan grants, or suspend/revoke users | Yes | No (`403`) | No (`403`) |
| View & export immutable `AuditLog` (`/api/sysop/audit`) | Yes | No (`403`) | No (`403`) |

### 2.2 Project / Folder / File ACL (`ProjectCollaborator` & `ProjectShareLink`)

| Project Action | `OWNER` | `EDITOR` | `COMMENTER` | `VIEWER` |
|---|---|---|---|---|
| Read files, compile preview, download PDF/ZIP | Yes | Yes | Yes | Yes |
| Add/reply to inline comments (`/api/projects/[id]/comments`) | Yes | Yes | Yes | No (`403`) |
| Edit files, create/delete files, save versions, apply Orca AI patches | Yes | Yes | No (`403`) | No (`403`) |
| Manage collaborators & share links (`/api/projects/[id]/share`) | Yes | Yes | No (`403`) | No (`403`) |
| Delete project (`DELETE /api/projects/[id]`) | Yes | No (`403`) | No (`403`) | No (`403`) |

---

## 3. Immediate Revocation Mechanics

1. **Email Invitation Revocation (`revokeAccountInvitation`)**:
   - Transitions `AccountInvitation.status` from `PENDING` to `REVOKED`, records `revokedAt = now`, clears `activeForEmail = null` and `tokenHash = null`, and logs `account.invitation.revoke` in `AuditLog`.
2. **Code Pass Revocation (`revokeInviteCodePass`)**:
   - Transitions `InviteCodePass.status` to `REVOKED`, sets `revokedAt = now`, marks associated active redemptions as `REVOKED`, and logs `sysop.code_pass.revoke` in `AuditLog`.
3. **User Account Suspension / Session Revocation (`revokeUserAccess`)**:
   - Sets `User.status = "revoked"` (or `"suspended"`), increments `User.sessionVersion`, deletes all rows in `Session` where `userId = targetUser.id`, and logs `sysop.user.revoke_access` in `AuditLog`.
   - Because `getCurrentUser()` queries the live `Session` joined with `User` on every request, revoked accounts lose access instantaneously.
4. **Project Share Link / Collaborator Revocation**:
   - Sets `ProjectShareLink.revokedAt = now` or `ProjectCollaborator.status = "REVOKED"` and logs `project.share.revoke` in `AuditLog`.

---

## 4. Immutable Audit Log Catalog (`AuditLog`)

Every entry in `AuditLog` is append-only and captures:
- `actorId`, `actorEmail`, `actorRole`
- `action` (standardized dotted event identifier)
- `targetType` (`user`, `invitation`, `code_pass`, `organization`, `project`, `session`, `system`)
- `targetId`, `targetLabel`
- `reason` (operator-supplied justification when applicable)
- `ipAddress`, `userAgent`
- `metadataJson` (redacted structured metadata — never stores plaintext passwords, raw tokens, or API keys)
- `createdAt` (UTC timestamp)

### Standardized Audit Event Actions:
- `system.admin.bootstrap` — Root administrator created/promoted via CLI
- `auth.login.success` / `auth.login.failed` / `auth.logout` — Session lifecycle
- `account.invitation.create` / `account.invitation.rotate` / `account.invitation.revoke` / `account.invitation.accept` — Email invitation lifecycle
- `sysop.code_pass.issue` / `sysop.code_pass.redeem` / `sysop.code_pass.revoke` — Shareable code pass lifecycle
- `sysop.personal_pass.issue` / `sysop.personal_pass.revoke` / `sysop.personal_pass.extend` — Personal pass lifecycle
- `sysop.organization.create` / `sysop.organization.update` / `sysop.organization.terminate` — Organization contract lifecycle
- `sysop.user.role_change` / `sysop.user.plan_grant` / `sysop.user.status_change` / `sysop.user.revoke_sessions` — User administration
- `project.create` / `project.delete` / `project.share.invite` / `project.share.link_create` / `project.share.revoke` — Project governance
