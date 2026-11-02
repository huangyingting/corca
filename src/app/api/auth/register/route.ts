import { NextRequest, NextResponse } from 'next/server';
import {
  AccountAdmissionError,
  registerAccount,
  setDatabaseSessionCookie,
} from '@/lib/account-admission';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name : null;
    const token =
      typeof body.token === 'string'
        ? body.token
        : typeof body.invitationToken === 'string'
          ? body.invitationToken
          : null;
    const inviteCode =
      typeof body.inviteCode === 'string'
        ? body.inviteCode
        : typeof body.code === 'string'
          ? body.code
          : null;

    const result = await registerAccount({
      email,
      password,
      name,
      token,
      inviteCode,
    });

    const response = NextResponse.json(
      {
        ok: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          planTier: result.user.operatorGrantPlan || result.user.planTier,
        },
      },
      { status: 201 }
    );
    setDatabaseSessionCookie(response, result.session);
    return response;
  } catch (error) {
    if (error instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'internal_error', message: 'Registration failed.' },
      { status: 500 }
    );
  }
}
