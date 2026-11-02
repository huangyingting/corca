import { Prisma, type AccountInvitation } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from './audit';
import { AccountAdmissionError } from './errors';
import {
  isValidAccountEmail,
  normalizeAccountEmail,
  normalizePlanTier,
  normalizeSystemRole,
  type PlanTier,
  type SystemRole,
} from './policy';
import { createOpaqueToken, hashOpaqueToken } from './tokens';

const DEFAULT_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CreateAccountInvitationInput = {
  email: string;
  role?: SystemRole;
  planTier?: PlanTier;
  reason?: string | null;
  invitedById?: string | null;
  invitedByEmail?: string | null;
  expiresAt?: Date;
};

export type AccountInvitationGrant = {
  invitation: AccountInvitation;
  token: string;
  invitePath: string;
  delivery: { queued: boolean; reason?: string };
};

export type PublicInvitationView = {
  id: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired' | 'invalid';
  maskedEmail: string | null;
  email?: string;
  role?: string;
  planTier?: string;
  expiresAt: Date | null;
};

function invitationExpiry(now: Date, requested?: Date): Date {
  const expiresAt =
    requested ?? new Date(now.getTime() + DEFAULT_INVITATION_TTL_MS);
  if (
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt.getTime() <= now.getTime() ||
    expiresAt.getTime() > now.getTime() + 90 * 86400000
  ) {
    throw new AccountAdmissionError(
      400,
      'invalid_expiry',
      'Invitation expiry must be in the future and within the next 90 days.'
    );
  }
  return expiresAt;
}

export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export async function expirePendingInvitations(now = new Date()): Promise<number> {
  const result = await prisma.accountInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      activeForEmail: null,
      tokenHash: null,
    },
  });
  return result.count;
}

export async function createAccountInvitation(
  input: CreateAccountInvitationInput
): Promise<AccountInvitationGrant> {
  const normalizedEmail = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(input.email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid email address.'
    );
  }

  const role = normalizeSystemRole(input.role);
  const planTier = normalizePlanTier(input.planTier);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();
  const expiresAt = invitationExpiry(now, input.expiresAt);

  try {
    await prisma.accountInvitation.updateMany({
      where: {
        activeForEmail: normalizedEmail,
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new AccountAdmissionError(
        409,
        'already_member',
        'A CorTeX account already exists for this email.'
      );
    }

    const active = await prisma.accountInvitation.findUnique({
      where: { activeForEmail: normalizedEmail },
      select: { id: true },
    });
    if (active) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active invitation already exists for this email.'
      );
    }

    const invitation = await prisma.accountInvitation.create({
      data: {
        email: input.email.trim(),
        normalizedEmail,
        activeForEmail: normalizedEmail,
        tokenHash,
        role,
        planTier,
        reason: input.reason?.trim() || null,
        invitedById: input.invitedById || null,
        expiresAt,
        emails: {
          create: {
            payload: JSON.stringify({
              to: normalizedEmail,
              role,
              planTier,
              expiresAt: expiresAt.toISOString(),
            }),
            status: 'sent',
            sentAt: now,
            expiresAt,
          },
        },
      },
    });

    await recordAuditLog({
      actorId: input.invitedById || null,
      actorEmail: input.invitedByEmail || null,
      actorRole: 'Admin',
      action: 'account.invitation.create',
      targetType: 'invitation',
      targetId: invitation.id,
      targetLabel: normalizedEmail,
      reason: input.reason || 'Single-use email invitation issued',
      metadata: {
        email: normalizedEmail,
        role,
        planTier,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      invitation,
      token,
      invitePath: `/invite/${token}`,
      delivery: {
        queued: true,
        reason: 'Share this single-use invitation link directly with the recipient.',
      },
    };
  } catch (error) {
    if (isUniqueConflict(error)) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active invitation already exists for this email.'
      );
    }
    throw error;
  }
}

export async function inspectAccountInvitation(
  token: string,
  now = new Date()
): Promise<PublicInvitationView> {
  const tokenHash = hashOpaqueToken(token);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      status: true,
      role: true,
      planTier: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    return { id: '', status: 'invalid', maskedEmail: null, expiresAt: null };
  }

  if (invitation.status === 'PENDING' && invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', tokenHash },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    return {
      id: invitation.id,
      status: 'expired',
      maskedEmail: maskEmail(invitation.email),
      expiresAt: invitation.expiresAt,
    };
  }

  return {
    id: invitation.id,
    status: invitation.status.toLowerCase() as PublicInvitationView['status'],
    maskedEmail: maskEmail(invitation.email),
    email: invitation.email,
    role: invitation.role,
    planTier: invitation.planTier,
    expiresAt: invitation.expiresAt,
  };
}

export async function rotateAccountInvitation(
  id: string,
  actor?: { id?: string | null; email?: string | null }
): Promise<AccountInvitationGrant> {
  const now = new Date();
  const existing = await prisma.accountInvitation.findUnique({ where: { id } });
  if (!existing) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (existing.status !== 'PENDING') {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be rotated.'
    );
  }

  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = invitationExpiry(now);

  const invitation = await prisma.accountInvitation.update({
    where: { id },
    data: {
      tokenHash,
      expiresAt,
    },
  });

  await recordAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    actorRole: 'Admin',
    action: 'account.invitation.rotate',
    targetType: 'invitation',
    targetId: invitation.id,
    targetLabel: invitation.normalizedEmail,
    reason: 'Rotated invitation token and extended expiry',
  });

  return {
    invitation,
    token,
    invitePath: `/invite/${token}`,
    delivery: {
      queued: true,
      reason: 'Invitation token rotated; previous link is immediately invalidated.',
    },
  };
}

export async function revokeAccountInvitation(
  id: string,
  actor?: { id?: string | null; email?: string | null; reason?: string | null }
): Promise<AccountInvitation> {
  const now = new Date();
  const invitation = await prisma.accountInvitation.findUnique({
    where: { id },
  });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status === 'REVOKED') {
    return invitation;
  }
  if (invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be revoked.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: now,
      activeForEmail: null,
      tokenHash: null,
    },
  });

  await recordAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    actorRole: 'Admin',
    action: 'account.invitation.revoke',
    targetType: 'invitation',
    targetId: updated.id,
    targetLabel: updated.normalizedEmail,
    reason: actor?.reason || 'Pending invitation revoked',
  });

  return updated;
}
