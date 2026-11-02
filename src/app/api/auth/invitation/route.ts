import { NextRequest, NextResponse } from 'next/server';
import { inspectAccountInvitation } from '@/lib/account-admission';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() || '';
  if (!token) {
    return NextResponse.json(
      { id: '', status: 'invalid', maskedEmail: null, expiresAt: null },
      { status: 400 }
    );
  }

  const invitation = await inspectAccountInvitation(token);
  const status = invitation.status === 'pending' ? 200 : 410;
  return NextResponse.json(invitation, { status });
}
