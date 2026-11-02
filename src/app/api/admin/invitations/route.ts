import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AccountAdmissionError,
  createAccountInvitation,
  expirePendingInvitations,
  getCurrentUser,
  type PlanTier,
  type SystemRole,
} from '@/lib/account-admission';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Admin') {
    return NextResponse.json(
      { error: 'forbidden', message: 'Administrator role required.' },
      { status: 403 }
    );
  }

  await expirePendingInvitations();

  const invitations = await prisma.accountInvitation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
      acceptedBy: { select: { id: true, name: true, email: true } },
    },
    take: 100,
  });

  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'forbidden', message: 'Administrator role required.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email : '';
    const role = (typeof body.role === 'string' ? body.role : 'Researcher') as SystemRole;
    const planTier = (typeof body.planTier === 'string' ? body.planTier : 'standard') as PlanTier;
    const reason = typeof body.reason === 'string' ? body.reason : null;
    const expiresInDays = Number(body.expiresInDays) || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);

    const grant = await createAccountInvitation({
      email,
      role,
      planTier,
      reason,
      invitedById: user.id,
      invitedByEmail: user.email,
      expiresAt,
    });

    return NextResponse.json(
      {
        ok: true,
        invitation: grant.invitation,
        token: grant.token,
        invitePath: grant.invitePath,
        delivery: grant.delivery,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to create invitation.' },
      { status: 500 }
    );
  }
}
