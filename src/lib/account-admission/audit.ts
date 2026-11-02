import { prisma } from '@/lib/prisma';

export type AuditLogInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId || null,
      actorEmail: input.actorEmail || null,
      actorRole: input.actorRole || null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      targetLabel: input.targetLabel || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      reason: input.reason || null,
      metadataJson: JSON.stringify(input.metadata || {}),
    },
  });
}
