import { NextRequest, NextResponse } from 'next/server';
import {
  AccountAdmissionError,
  getCurrentUser,
  inspectInviteCodePass,
  redeemCodePassForExistingUser,
} from '@/lib/account-admission';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim() || '';
  if (!code) {
    return NextResponse.json(
      { valid: false, status: 'invalid', message: 'Enter an invitation pass code.' },
      { status: 400 }
    );
  }

  const info = await inspectInviteCodePass(code);
  return NextResponse.json(info, { status: info.valid ? 200 : 410 });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Sign in or register with this code.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code : '';
    if (!code.trim()) {
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

    return NextResponse.json({
      ok: true,
      redemption,
    });
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Unable to redeem code pass.' },
      { status: 500 }
    );
  }
}
