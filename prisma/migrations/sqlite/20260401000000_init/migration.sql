-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetTokenHash" TEXT,
    "resetExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "activeForEmail" TEXT,
    "tokenHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "role" TEXT NOT NULL DEFAULT 'Researcher',
    "planTier" TEXT NOT NULL DEFAULT 'free',
    "reason" TEXT,
    "invitedById" TEXT,
    "acceptedById" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccountInvitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InviteCodePass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codeHash" TEXT NOT NULL,
    "codePrefix" TEXT NOT NULL,
    "rawCode" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Researcher',
    "planTier" TEXT NOT NULL DEFAULT 'standard',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contractRef" TEXT,
    "reason" TEXT,
    "issuedById" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteCodePass_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InviteCodeRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codePassId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessEndsAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    CONSTRAINT "InviteCodeRedemption_codePassId_fkey" FOREIGN KEY ("codePassId") REFERENCES "InviteCodePass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InviteCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalPass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientEmail" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "userId" TEXT,
    "planTier" TEXT NOT NULL DEFAULT 'standard',
    "durationDays" INTEGER NOT NULL DEFAULT 365,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_ACTIVATION',
    "contractRef" TEXT,
    "reason" TEXT,
    "activationDeadline" DATETIME NOT NULL,
    "activatedAt" DATETIME,
    "endsAt" DATETIME,
    "revokedAt" DATETIME,
    "issuedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PersonalPass_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "contractRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "standardSeats" INTEGER NOT NULL DEFAULT 10,
    "proSeats" INTEGER NOT NULL DEFAULT 5,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "seatPlan" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountEmailOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "claimToken" TEXT,
    "lastAttemptAt" DATETIME,
    "lastError" TEXT,
    "sentAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitationId" TEXT,
    CONSTRAINT "AccountEmailOutbox_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "AccountInvitation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "name" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Researcher',
    "status" TEXT NOT NULL DEFAULT 'active',
    "planTier" TEXT NOT NULL DEFAULT 'free',
    "operatorGrantPlan" TEXT,
    "uiLanguage" TEXT NOT NULL DEFAULT 'en',
    "dailyTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "monthlyTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "storageBytesUsed" INTEGER NOT NULL DEFAULT 0,
    "labsConfigJson" TEXT NOT NULL DEFAULT '{"autoCompileOnIdle":true,"synctexHighlight":true,"academicPhrasebankSlash":true,"darkPdfPreview":false}',
    "byokOpenAiKeyEncrypted" TEXT,
    "byokOpenAiKeyHint" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'feedback',
    "message" TEXT NOT NULL,
    "pageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "format" TEXT NOT NULL DEFAULT 'latex',
    "templateId" TEXT NOT NULL DEFAULT 'blank-article',
    "texliveVersion" TEXT NOT NULL DEFAULT 'tl2026-20260826-b6584b4',
    "latexEngine" TEXT NOT NULL DEFAULT 'auto',
    "mainFilePath" TEXT NOT NULL DEFAULT 'main.tex',
    "ownerId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "gitRepoUrl" TEXT,
    "gitBranch" TEXT NOT NULL DEFAULT 'main',
    "gitLastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "folderPath" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'tex',
    "content" TEXT NOT NULL DEFAULT '',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "snapshotJson" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "lineNumber" INTEGER,
    "anchorText" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "parentId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL DEFAULT 'Researcher',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectCollaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEWER',
    "scopeType" TEXT NOT NULL DEFAULT 'PROJECT',
    "scopePath" TEXT NOT NULL DEFAULT '/',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "invitedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectCollaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectShareLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "rawToken" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEWER',
    "scopeType" TEXT NOT NULL DEFAULT 'PROJECT',
    "scopePath" TEXT NOT NULL DEFAULT '/',
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectShareLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GalleryPublication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Papers',
    "format" TEXT NOT NULL DEFAULT 'latex',
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "contentPreview" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GalleryPublication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GalleryPublication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LibraryReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "citeKey" TEXT NOT NULL,
    "authorsJson" TEXT NOT NULL DEFAULT '[]',
    "year" INTEGER,
    "venue" TEXT,
    "doi" TEXT,
    "arxivId" TEXT,
    "openAlexId" TEXT,
    "url" TEXT,
    "abstract" TEXT,
    "note" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "bibtex" TEXT NOT NULL,
    "pdfFileName" TEXT,
    "pdfStoragePath" TEXT,
    "pdfSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "pdfTextContent" TEXT,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "referenceCount" INTEGER NOT NULL DEFAULT 0,
    "inTrash" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LibraryReference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LibraryAnnotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'highlight',
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "selectedText" TEXT,
    "comment" TEXT,
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "rectJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LibraryAnnotation_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "LibraryReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LibraryAnnotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCredential_userId_key" ON "PasswordCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCredential_resetTokenHash_key" ON "PasswordCredential"("resetTokenHash");

-- CreateIndex
CREATE INDEX "PasswordCredential_resetExpiresAt_idx" ON "PasswordCredential"("resetExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitation_activeForEmail_key" ON "AccountInvitation"("activeForEmail");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitation_tokenHash_key" ON "AccountInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountInvitation_status_expiresAt_idx" ON "AccountInvitation"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "AccountInvitation_normalizedEmail_createdAt_idx" ON "AccountInvitation"("normalizedEmail", "createdAt");

-- CreateIndex
CREATE INDEX "AccountInvitation_invitedById_idx" ON "AccountInvitation"("invitedById");

-- CreateIndex
CREATE INDEX "AccountInvitation_acceptedById_idx" ON "AccountInvitation"("acceptedById");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCodePass_codeHash_key" ON "InviteCodePass"("codeHash");

-- CreateIndex
CREATE INDEX "InviteCodePass_status_expiresAt_idx" ON "InviteCodePass"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "InviteCodePass_issuedById_idx" ON "InviteCodePass"("issuedById");

-- CreateIndex
CREATE INDEX "InviteCodeRedemption_userId_idx" ON "InviteCodeRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCodeRedemption_codePassId_userId_key" ON "InviteCodeRedemption"("codePassId", "userId");

-- CreateIndex
CREATE INDEX "PersonalPass_normalizedEmail_idx" ON "PersonalPass"("normalizedEmail");

-- CreateIndex
CREATE INDEX "PersonalPass_status_idx" ON "PersonalPass"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_email_key" ON "OrganizationMember"("organizationId", "email");

-- CreateIndex
CREATE INDEX "AccountEmailOutbox_status_createdAt_idx" ON "AccountEmailOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AccountEmailOutbox_invitationId_idx" ON "AccountEmailOutbox"("invitationId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_ownerId_updatedAt_idx" ON "Project"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFile_projectId_path_key" ON "ProjectFile"("projectId", "path");

-- CreateIndex
CREATE INDEX "ProjectVersion_projectId_createdAt_idx" ON "ProjectVersion"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectComment_projectId_filePath_idx" ON "ProjectComment"("projectId", "filePath");

-- CreateIndex
CREATE INDEX "ProjectCollaborator_projectId_idx" ON "ProjectCollaborator"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCollaborator_userId_idx" ON "ProjectCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCollaborator_projectId_email_scopeType_scopePath_key" ON "ProjectCollaborator"("projectId", "email", "scopeType", "scopePath");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectShareLink_tokenHash_key" ON "ProjectShareLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ProjectShareLink_projectId_idx" ON "ProjectShareLink"("projectId");

-- CreateIndex
CREATE INDEX "GalleryPublication_category_createdAt_idx" ON "GalleryPublication"("category", "createdAt");

-- CreateIndex
CREATE INDEX "LibraryReference_userId_inTrash_createdAt_idx" ON "LibraryReference"("userId", "inTrash", "createdAt");

-- CreateIndex
CREATE INDEX "LibraryAnnotation_referenceId_pageNumber_idx" ON "LibraryAnnotation"("referenceId", "pageNumber");

