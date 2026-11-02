import { prisma } from '@/lib/prisma';
import { recordAuditLog } from './audit';
import { AccountAdmissionError } from './errors';
import { hashPassword, verifyPassword } from './passwords';
import { normalizeAccountEmail } from './policy';
import { createDatabaseSession } from './session';
import { createOpaqueToken, hashOpaqueToken } from './tokens';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function authenticatePassword(input: {
  email: string;
  password: string;
  ipAddress?: string | null;
}) {
  const normalizedEmail = normalizeAccountEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { passwordCredential: true },
  });

  const valid = await verifyPassword(
    input.password,
    user?.passwordCredential?.passwordHash || DUMMY_PASSWORD_HASH
  );

  if (!valid || !user?.passwordCredential || !user.emailVerified) {
    await recordAuditLog({
      actorId: user?.id || null,
      actorEmail: normalizedEmail,
      action: 'auth.login.failed',
      targetType: 'user',
      targetId: user?.id || null,
      targetLabel: normalizedEmail,
      ipAddress: input.ipAddress || null,
      reason: 'Invalid credentials',
    });
    return null;
  }

  if (user.status !== 'active') {
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'auth.login.blocked',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
      ipAddress: input.ipAddress || null,
      reason: `Account status is ${user.status}`,
    });
    throw new AccountAdmissionError(
      403,
      'account_revoked',
      'This account has been suspended or revoked by a system operator.'
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const session = await createDatabaseSession(user.id);

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'auth.login.success',
    targetType: 'session',
    targetId: session.id,
    targetLabel: user.email,
    ipAddress: input.ipAddress || null,
  });

  return { user, session };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeAccountEmail(email);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { passwordCredential: true },
  });
  if (!user?.email || !user.passwordCredential) return null;

  await prisma.passwordCredential.update({
    where: { userId: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetExpiresAt: expiresAt,
    },
  });

  return { token, email: user.email, expiresAt };
}

export async function resetPassword(input: {
  token: string;
  password: string;
}) {
  const tokenHash = hashOpaqueToken(input.token);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const credential = await prisma.passwordCredential.findUnique({
    where: { resetTokenHash: tokenHash },
    select: { id: true, userId: true, resetExpiresAt: true },
  });

  if (!credential) {
    throw new AccountAdmissionError(
      410,
      'invalid_reset',
      'This password reset link is invalid or no longer active.'
    );
  }

  if (!credential.resetExpiresAt || credential.resetExpiresAt <= now) {
    await prisma.passwordCredential.updateMany({
      where: {
        id: credential.id,
        resetTokenHash: tokenHash,
        resetExpiresAt: { lte: now },
      },
      data: { resetTokenHash: null, resetExpiresAt: null },
    });
    throw new AccountAdmissionError(
      410,
      'expired',
      'This password reset link has expired.'
    );
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordCredential.updateMany({
      where: {
        id: credential.id,
        resetTokenHash: tokenHash,
        resetExpiresAt: { gt: now },
      },
      data: {
        passwordHash,
        passwordChangedAt: now,
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    });
    if (!claimed.count) {
      throw new AccountAdmissionError(
        410,
        'invalid_reset',
        'This reset link has already been used.'
      );
    }
    await tx.session.deleteMany({ where: { userId: credential.userId } });
  });

  return { userId: credential.userId };
}
