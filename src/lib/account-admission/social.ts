import { prisma } from '@/lib/prisma';
import { recordAuditLog } from './audit';
import {
  isValidAccountEmail,
  normalizeAccountEmail,
  normalizePlanTier,
  normalizeSystemRole,
} from './policy';

export function verifiedProviderEmail(
  provider: string,
  profile: Record<string, unknown> | undefined
): string | null {
  if (!profile) return null;
  if (provider === 'google') {
    const email = typeof profile.email === 'string' ? profile.email : '';
    const verified = profile.email_verified === true;
    return verified && isValidAccountEmail(email)
      ? normalizeAccountEmail(email)
      : null;
  }
  return null;
}

export async function authorizeSocialSignIn(params: {
  provider: string;
  providerAccountId: string;
  type?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
  sessionState?: string;
  profile?: Record<string, unknown>;
  userName?: string | null;
  userImage?: string | null;
}): Promise<true | string> {
  const now = new Date();

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: params.provider,
        providerAccountId: params.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    if (existingAccount.user.status !== 'active') {
      return '/login?error=AccountRevoked';
    }
    return true;
  }

  const verifiedEmail = verifiedProviderEmail(params.provider, params.profile);
  if (!verifiedEmail) {
    return '/login?error=OAuthEmailUnverified';
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: verifiedEmail },
  });

  if (existingUser) {
    if (existingUser.status !== 'active') {
      return '/login?error=AccountRevoked';
    }
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        type: params.type || 'oauth',
        provider: params.provider,
        providerAccountId: params.providerAccountId,
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        expires_at: params.expiresAt,
        token_type: params.tokenType,
        scope: params.scope,
        id_token: params.idToken,
        session_state: params.sessionState,
      },
    });
    if (!existingUser.emailVerified) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: now },
      });
    }
    return true;
  }

  const invitation = await prisma.accountInvitation.findUnique({
    where: { activeForEmail: verifiedEmail },
  });

  if (invitation && invitation.status === 'PENDING' && invitation.expiresAt > now) {
    const displayName =
      params.userName?.trim() ||
      (typeof params.profile?.name === 'string' && params.profile.name.trim()) ||
      verifiedEmail.split('@')[0];

    const user = await prisma.$transaction(async (tx) => {
      const claimed = await tx.accountInvitation.updateMany({
        where: {
          id: invitation.id,
          activeForEmail: verifiedEmail,
          status: 'PENDING',
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
        throw new Error('The account invitation is no longer active.');
      }

      const createdUser = await tx.user.create({
        data: {
          email: verifiedEmail,
          name: displayName,
          image: params.userImage || null,
          role: normalizeSystemRole(invitation.role),
          planTier: normalizePlanTier(invitation.planTier),
          status: 'active',
          emailVerified: now,
        },
      });

      await tx.account.create({
        data: {
          userId: createdUser.id,
          type: params.type || 'oauth',
          provider: params.provider,
          providerAccountId: params.providerAccountId,
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
          expires_at: params.expiresAt,
          token_type: params.tokenType,
          scope: params.scope,
          id_token: params.idToken,
          session_state: params.sessionState,
        },
      });

      await tx.accountInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: createdUser.id,
          acceptedAt: now,
          activeForEmail: null,
          tokenHash: null,
        },
      });

      return createdUser;
    });

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'account.invitation.accept',
      targetType: 'invitation',
      targetId: invitation.id,
      targetLabel: user.email,
      reason: 'Accepted invitation via verified Google OAuth',
    });

    return true;
  }

  return '/login?error=InvitationRequired';
}
