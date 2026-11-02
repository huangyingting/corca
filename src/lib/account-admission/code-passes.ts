import { prisma } from '@/lib/prisma';
import { recordAuditLog } from './audit';
import { AccountAdmissionError } from './errors';
import {
  normalizePlanTier,
  normalizeSystemRole,
  type PlanTier,
  type SystemRole,
} from './policy';
import {
  createInvitePassCode,
  hashInvitePassCode,
  normalizeInvitePassCode,
} from './tokens';

export type IssueCodePassBatchInput = {
  name: string;
  role?: SystemRole;
  planTier?: PlanTier;
  durationDays?: number;
  maxUses?: number;
  quantity?: number;
  expiresAt?: Date;
  contractRef?: string | null;
  reason?: string | null;
  issuedById?: string | null;
  issuedByEmail?: string | null;
};

export async function expireCodePasses(now = new Date()): Promise<number> {
  const result = await prisma.inviteCodePass.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
    },
  });
  return result.count;
}

export async function issueCodePassBatch(input: IssueCodePassBatchInput) {
  const name = input.name?.trim() || 'CorTeX Access Pass';
  const role = normalizeSystemRole(input.role);
  const planTier = normalizePlanTier(input.planTier || 'standard');
  const durationDays = Math.max(1, Math.min(3650, Number(input.durationDays) || 30));
  const maxUses = Math.max(1, Math.min(1000, Number(input.maxUses) || 1));
  const quantity = Math.max(1, Math.min(100, Number(input.quantity) || 1));
  const now = new Date();
  const expiresAt =
    input.expiresAt && input.expiresAt > now
      ? input.expiresAt
      : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const createdPasses = [];

  for (let i = 0; i < quantity; i += 1) {
    const rawCode = createInvitePassCode();
    const codeHash = hashInvitePassCode(rawCode);
    const codePrefix = `${rawCode.slice(0, 8)}••••`;
    const pass = await prisma.inviteCodePass.create({
      data: {
        codeHash,
        codePrefix,
        rawCode,
        name,
        role,
        planTier,
        durationDays,
        maxUses,
        usedCount: 0,
        status: 'ACTIVE',
        contractRef: input.contractRef?.trim() || null,
        reason: input.reason?.trim() || null,
        issuedById: input.issuedById || null,
        expiresAt,
      },
    });
    createdPasses.push({
      ...pass,
      code: rawCode,
      redeemPath: `/redeem?code=${encodeURIComponent(rawCode)}`,
    });
  }

  await recordAuditLog({
    actorId: input.issuedById || null,
    actorEmail: input.issuedByEmail || null,
    actorRole: 'Admin',
    action: 'sysop.code_pass.issue',
    targetType: 'code_pass',
    targetId: createdPasses[0]?.id || null,
    targetLabel: `${name} (${quantity} code(s))`,
    reason: input.reason || 'Issued single-use/expiring invitation code pass batch',
    metadata: {
      name,
      role,
      planTier,
      durationDays,
      maxUses,
      quantity,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return createdPasses;
}

export async function inspectInviteCodePass(rawCode: string, now = new Date()) {
  const normalized = normalizeInvitePassCode(rawCode);
  if (!normalized) {
    return { valid: false, status: 'invalid' as const };
  }
  const codeHash = hashInvitePassCode(normalized);
  const pass = await prisma.inviteCodePass.findUnique({
    where: { codeHash },
  });

  if (!pass) {
    return { valid: false, status: 'invalid' as const };
  }

  if (pass.status === 'ACTIVE' && pass.expiresAt <= now) {
    await prisma.inviteCodePass.updateMany({
      where: { id: pass.id, status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    return {
      valid: false,
      status: 'expired' as const,
      id: pass.id,
      name: pass.name,
      role: pass.role,
      planTier: pass.planTier,
      durationDays: pass.durationDays,
      expiresAt: pass.expiresAt,
    };
  }

  if (pass.status !== 'ACTIVE' || pass.usedCount >= pass.maxUses) {
    return {
      valid: false,
      status: (pass.status === 'REVOKED'
        ? 'revoked'
        : pass.status === 'EXPIRED'
          ? 'expired'
          : 'consumed') as 'revoked' | 'expired' | 'consumed',
      id: pass.id,
      name: pass.name,
      role: pass.role,
      planTier: pass.planTier,
      durationDays: pass.durationDays,
      expiresAt: pass.expiresAt,
    };
  }

  return {
    valid: true,
    status: 'active' as const,
    id: pass.id,
    name: pass.name,
    role: pass.role,
    planTier: pass.planTier,
    durationDays: pass.durationDays,
    maxUses: pass.maxUses,
    usedCount: pass.usedCount,
    expiresAt: pass.expiresAt,
  };
}

export async function revokeInviteCodePass(
  id: string,
  actor?: { id?: string | null; email?: string | null; reason?: string | null }
) {
  const now = new Date();
  const pass = await prisma.inviteCodePass.findUnique({ where: { id } });
  if (!pass) {
    throw new AccountAdmissionError(404, 'not_found', 'Code pass not found.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.inviteCodePass.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: now,
        rawCode: null,
      },
    });
    await tx.inviteCodeRedemption.updateMany({
      where: { codePassId: id, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: now },
    });
    return p;
  });

  await recordAuditLog({
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    actorRole: 'Admin',
    action: 'sysop.code_pass.revoke',
    targetType: 'code_pass',
    targetId: updated.id,
    targetLabel: `${updated.name} (${updated.codePrefix})`,
    reason: actor?.reason || 'Revoked invite code pass',
  });

  return updated;
}

export async function redeemCodePassForExistingUser(params: {
  userId: string;
  userEmail: string;
  code: string;
}) {
  const now = new Date();
  const normalized = normalizeInvitePassCode(params.code);
  const codeHash = hashInvitePassCode(normalized);
  const pass = await prisma.inviteCodePass.findUnique({ where: { codeHash } });

  if (!pass || pass.status !== 'ACTIVE') {
    throw new AccountAdmissionError(
      410,
      'invalid_code',
      'This invitation code pass is invalid, revoked, or already consumed.'
    );
  }

  if (pass.expiresAt <= now) {
    await prisma.inviteCodePass.updateMany({
      where: { id: pass.id, status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    throw new AccountAdmissionError(410, 'expired', 'This code pass has expired.');
  }

  if (pass.usedCount >= pass.maxUses) {
    throw new AccountAdmissionError(
      410,
      'code_exhausted',
      'This code pass has already reached its usage limit.'
    );
  }

  const accessEndsAt = new Date(now.getTime() + pass.durationDays * 86400000);

  const result = await prisma.$transaction(async (tx) => {
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
        'This code pass is no longer available.'
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

    const redemption = await tx.inviteCodeRedemption.create({
      data: {
        codePassId: pass.id,
        userId: params.userId,
        status: 'ACTIVE',
        redeemedAt: now,
        accessEndsAt,
      },
    });

    await tx.user.update({
      where: { id: params.userId },
      data: {
        planTier: pass.planTier,
      },
    });

    return redemption;
  });

  await recordAuditLog({
    actorId: params.userId,
    actorEmail: params.userEmail,
    action: 'sysop.code_pass.redeem',
    targetType: 'code_pass',
    targetId: pass.id,
    targetLabel: `${pass.name} (${pass.codePrefix})`,
    reason: 'User redeemed pass code',
    metadata: {
      planTier: pass.planTier,
      durationDays: pass.durationDays,
      accessEndsAt: accessEndsAt.toISOString(),
    },
  });

  return result;
}
