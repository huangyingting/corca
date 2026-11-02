import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AccountAdmissionError,
  getCurrentUser,
  redeemCodePassForExistingUser,
} from '@/lib/account-admission';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [codeRedemptions, personalPasses, orgMemberships] = await Promise.all([
    prisma.inviteCodeRedemption.findMany({
      where: { userId: user.id },
      include: { codePass: true },
      orderBy: { redeemedAt: 'desc' },
    }),
    prisma.personalPass.findMany({
      where: {
        OR: [{ userId: user.id }, { normalizedEmail: user.email }],
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.organizationMember.findMany({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
      include: { organization: true },
      orderBy: { joinedAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    codeRedemptions,
    personalPasses,
    organizations: orgMemberships,
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json(
        { error: 'missing_code', message: 'Enter a valid pass code.' },
        { status: 400 }
      );
    }

    const redemption = await redeemCodePassForExistingUser({
      userId: user.id,
      userEmail: user.email,
      code,
    });

    return NextResponse.json({ ok: true, redemption });
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to redeem pass.' },
      { status: 500 }
    );
  }
}
