import { prisma } from '@/lib/prisma';
import { recordAuditLog } from './audit';
import { AccountAdmissionError } from './errors';
import { hashPassword } from './passwords';
import {
  accountAdmissionMode,
  isValidAccountEmail,
  normalizeAccountEmail,
  normalizePlanTier,
  normalizeSystemRole,
} from './policy';
import { createDatabaseSession } from './session';
import {
  hashInvitePassCode,
  hashOpaqueToken,
  normalizeInvitePassCode,
} from './tokens';

export type RegistrationInput = {
  email: string;
  password: string;
  name?: string | null;
  token?: string | null;
  inviteCode?: string | null;
};

function normalizedName(name: string | null | undefined, email: string): string {
  const value = name?.trim();
  if (value) return value.slice(0, 120);
  const prefix = email.split('@')[0] || 'Researcher';
  return prefix.slice(0, 120);
}

function registrationEmail(email: string): string {
  if (!isValidAccountEmail(email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid email address.'
    );
  }
  return normalizeAccountEmail(email);
}

function validatePasswordStrength(password: string) {
  if (!password || password.length < 8 || password.length > 128) {
    throw new AccountAdmissionError(
      400,
      'invalid_password',
      'Password must be between 8 and 128 characters.'
    );
  }
}

/**
 * Registers a user using an email-bound single-use AccountInvitation token.
 */
export async function registerWithInvitation(input: {
  email: string;
  password: string;
  name?: string | null;
  token: string;
}) {
  const normalizedEmail = registrationEmail(input.email);
  validatePasswordStrength(input.password);
  const tokenHash = hashOpaqueToken(input.token.trim());
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
  });
  if (!invitation || invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      410,
      'invalid_invitation',
      'This invitation is invalid, revoked, or has already been used.'
    );
  }

  if (invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash,
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    throw new AccountAdmissionError(
      410,
      'expired',
      'This invitation has expired.'
    );
  }

  if (invitation.normalizedEmail !== normalizedEmail) {
    throw new AccountAdmissionError(
      403,
      'email_mismatch',
      'The invitation does not match this email address.'
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    throw new AccountAdmissionError(
      409,
      'already_member',
      'A CorTeX account already exists for this email.'
    );
  }

  const assignedRole = normalizeSystemRole(invitation.role);
  const assignedPlan = normalizePlanTier(invitation.planTier);

  const user = await prisma.$transaction(async (tx) => {
    const claimed = await tx.accountInvitation.updateMany({
      where: {
        id: invitation.id,
        status: 'PENDING',
        tokenHash,
        expiresAt: { gt: now },
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: now,
        activeForEmail: null,
        tokenHash: null,
      },
    });
    if (!claimed.count) {
      throw new AccountAdmissionError(
        410,
        'invalid_invitation',
        'This invitation is no longer active.'
      );
    }

    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        emailVerified: now,
        name: normalizedName(input.name, normalizedEmail),
        role: assignedRole,
        planTier: assignedPlan,
        status: 'active',
        passwordCredential: {
          create: { passwordHash, passwordChangedAt: now },
        },
      },
    });

    await tx.accountInvitation.update({
      where: { id: invitation.id },
      data: { acceptedById: created.id },
    });

    return created;
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'account.invitation.accept',
    targetType: 'invitation',
    targetId: invitation.id,
    targetLabel: user.email,
    reason: 'Registered account via single-use email invitation',
    metadata: {
      role: user.role,
      planTier: user.planTier,
    },
  });

  const session = await createDatabaseSession(user.id, now);
  return { user, session };
}

/**
 * Registers a user using a single-use or bounded-use expiring InviteCodePass (CTX-XXXX-XXXX-XXXX).
 */
export async function registerWithInviteCode(input: {
  email: string;
  password: string;
  name?: string | null;
  inviteCode: string;
}) {
  const normalizedEmail = registrationEmail(input.email);
  validatePasswordStrength(input.password);
  const normalizedCode = normalizeInvitePassCode(input.inviteCode);
  const codeHash = hashInvitePassCode(normalizedCode);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const pass = await prisma.inviteCodePass.findUnique({
    where: { codeHash },
  });

  if (!pass || pass.status !== 'ACTIVE') {
    throw new AccountAdmissionError(
      410,
      'invalid_code',
      'This invitation code is invalid, revoked, or has already been consumed.'
    );
  }

  if (pass.expiresAt <= now) {
    await prisma.inviteCodePass.updateMany({
      where: { id: pass.id, status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    throw new AccountAdmissionError(
      410,
      'expired',
      'This invitation code has expired.'
    );
  }

  if (pass.usedCount >= pass.maxUses) {
    throw new AccountAdmissionError(
      410,
      'code_exhausted',
      'This invitation code has already been used.'
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    throw new AccountAdmissionError(
      409,
      'already_member',
      'A CorTeX account already exists for this email.'
    );
  }

  const assignedRole = normalizeSystemRole(pass.role);
  const assignedPlan = normalizePlanTier(pass.planTier);
  const accessEndsAt = new Date(now.getTime() + pass.durationDays * 86400000);

  const user = await prisma.$transaction(async (tx) => {
    const claimed = await tx.inviteCodePass.updateMany({
      where: {
        id: pass.id,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        usedCount: { lt: pass.maxUses },
      },
      data: {
        usedCount: { increment: 1 },
      },
    });
    if (!claimed.count) {
      throw new AccountAdmissionError(
        410,
        'code_exhausted',
        'This invitation code is no longer available.'
      );
    }

    const refreshed = await tx.inviteCodePass.findUniqueOrThrow({
      where: { id: pass.id },
    });
    if (refreshed.usedCount >= refreshed.maxUses) {
      await tx.inviteCodePass.update({
        where: { id: pass.id },
        data: { status: 'CONSUMED', rawCode: null },
      });
    }

    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        emailVerified: now,
        name: normalizedName(input.name, normalizedEmail),
        role: assignedRole,
        planTier: assignedPlan,
        status: 'active',
        passwordCredential: {
          create: { passwordHash, passwordChangedAt: now },
        },
      },
    });

    await tx.inviteCodeRedemption.create({
      data: {
        codePassId: pass.id,
        userId: created.id,
        status: 'ACTIVE',
        redeemedAt: now,
        accessEndsAt,
      },
    });

    return created;
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'sysop.code_pass.redeem',
    targetType: 'code_pass',
    targetId: pass.id,
    targetLabel: `${pass.name} (${pass.codePrefix})`,
    reason: 'Registered account via single-use/expiring invitation code pass',
    metadata: {
      email: user.email,
      role: user.role,
      planTier: user.planTier,
      accessEndsAt: accessEndsAt.toISOString(),
    },
  });

  const session = await createDatabaseSession(user.id, now);
  return { user, session };
}

/**
 * Unified registration entry point enforcing ACCOUNT_ADMISSION_MODE ("invitation-only" default).
 */
export async function registerAccount(input: RegistrationInput) {
  if (input.token?.trim()) {
    return registerWithInvitation({
      email: input.email,
      password: input.password,
      name: input.name,
      token: input.token.trim(),
    });
  }

  if (input.inviteCode?.trim()) {
    return registerWithInviteCode({
      email: input.email,
      password: input.password,
      name: input.name,
      inviteCode: input.inviteCode.trim(),
    });
  }

  if (accountAdmissionMode() === 'invitation-only') {
    throw new AccountAdmissionError(
      403,
      'invitation_required',
      'CorTeX registration is invitation-only. Enter a valid single-use invitation link or invitation pass code.'
    );
  }

  // Only reachable if operator explicitly sets ACCOUNT_ADMISSION_MODE="public"
  const normalizedEmail = registrationEmail(input.email);
  validatePasswordStrength(input.password);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    throw new AccountAdmissionError(
      409,
      'already_member',
      'A CorTeX account already exists for this email.'
    );
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      emailVerified: now,
      name: normalizedName(input.name, normalizedEmail),
      role: 'Researcher',
      planTier: 'free',
      status: 'active',
      passwordCredential: {
        create: { passwordHash, passwordChangedAt: now },
      },
    },
  });

  const session = await createDatabaseSession(user.id, now);
  return { user, session };
}
